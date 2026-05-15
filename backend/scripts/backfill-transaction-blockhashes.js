#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const KeetaNet = require("@keetanetwork/keetanet-client");

loadEnv(path.join(__dirname, "..", ".env"));

const write = process.argv.includes("--write");
const debug = process.argv.includes("--debug");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const historyLimitArg = process.argv.find((arg) =>
  arg.startsWith("--history-limit="),
);
const limit = limitArg ? Number(limitArg.split("=")[1]) : 0;
const historyLimit = historyLimitArg
  ? Number(historyLimitArg.split("=")[1])
  : 500;

const transactionSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount: String,
    message: String,
    blockHash: String,
    txHash: String,
  },
  { timestamps: true },
);

const userSchema = new mongoose.Schema({
  username: String,
  walletAddress: String,
});

const Transaction = mongoose.model("Transaction", transactionSchema);
const User = mongoose.model("User", userSchema);

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is missing");

  const network = process.env.KEETA_NETWORK || "test";
  const readerSeed = KeetaNet.lib.Account.generateRandomSeed({
    asString: true,
  });
  const readerAccount = KeetaNet.lib.Account.fromSeed(readerSeed, 0);
  const client = KeetaNet.UserClient.fromNetwork(network, readerAccount);

  await mongoose.connect(mongoUri);

  const query = Transaction.find({
    $or: [
      { blockHash: { $exists: false } },
      { blockHash: null },
      { blockHash: "" },
    ],
  })
    .sort({ createdAt: 1 })
    .populate("fromUserId", "username walletAddress")
    .populate("toUserId", "username walletAddress");

  if (limit > 0) query.limit(limit);

  const transactions = await query.lean();
  const stats = { checked: 0, fixed: 0, skipped: 0, unresolved: 0 };

  for (const tx of transactions) {
    stats.checked += 1;
    const blockHash = await resolveBlockHash(client, tx, historyLimit);

    if (!blockHash) {
      stats.unresolved += 1;
      console.warn(`unresolved ${tx._id}: txHash=${tx.txHash || "missing"}`);
      continue;
    }

    if (tx.blockHash === blockHash) {
      stats.skipped += 1;
      continue;
    }

    stats.fixed += 1;
    console.log(
      `${write ? "update" : "dry-run"} ${tx._id}: ${tx.txHash} -> ${blockHash}`,
    );

    if (write) {
      await Transaction.updateOne(
        { _id: tx._id },
        {
          $set: {
            blockHash,
            // txHash: blockHash,
          },
        },
      );
    }
  }

  await client.destroy?.();
  await mongoose.disconnect();

  console.log(
    `done checked=${stats.checked} fixed=${stats.fixed} skipped=${stats.skipped} unresolved=${stats.unresolved} mode=${write ? "write" : "dry-run"}`,
  );
}

async function resolveBlockHash(client, tx, historyLimit) {
  const candidates = [tx.blockHash, tx.txHash].filter(Boolean);
  for (const candidate of candidates) {
    if (await isBlockHash(client, candidate)) return candidate;
  }

  const fromWallet = tx.fromUserId?.walletAddress;
  const toWallet = tx.toUserId?.walletAddress;
  const atomicAmount = toAtomicKta(tx.amount);
  const createdAt = tx.createdAt ? new Date(tx.createdAt).getTime() : undefined;

  for (const wallet of [fromWallet, toWallet].filter(Boolean)) {
    const found = await findInHistory(client, {
      txId: tx._id,
      wallet,
      txHash: tx.txHash,
      fromWallet,
      toWallet,
      atomicAmount,
      createdAt,
      historyLimit,
    });
    if (found) return found;
  }

  return undefined;
}

async function isBlockHash(client, hash) {
  try {
    return Boolean(await client.block(hash));
  } catch {
    return false;
  }
}

async function findInHistory(
  client,
  {
    txId,
    wallet,
    txHash,
    fromWallet,
    toWallet,
    atomicAmount,
    createdAt,
    historyLimit,
  },
) {
  try {
    const account = KeetaNet.lib.Account.fromPublicKeyString(wallet);
    const entries = await client.history(
      { depth: historyLimit, pageSize: Math.min(historyLimit, 200) },
      { account },
    );

    if (debug) {
      console.log(
        `debug ${txId} wallet=${shortHash(wallet)} history=${entries.length} stored=${shortHash(txHash)}`,
      );
      for (const entry of entries.slice(0, 5)) {
        const blocks = entry.voteStaple?.blocks ?? [];
        console.log(
          `  staple=${shortHash(entry.voteStaple?.blocksHash?.toString?.())} blocks=${blocks
            .map((block) => shortHash(block.hash?.toString?.()))
            .join(",")}`,
        );
        for (const block of blocks) {
          const json = toBlockJson(block);
          console.log(
            `    block=${shortHash(block.hash?.toString?.())} account=${shortHash(json.account)} date=${json.date} ops=${JSON.stringify(json.operations ?? [])}`,
          );
        }
      }
    }

    for (const entry of entries) {
      const stapleHash = entry.voteStaple?.blocksHash?.toString?.();
      const blocks = entry.voteStaple?.blocks ?? [];
      const candidateBlocks =
        txHash && sameHash(stapleHash, txHash)
          ? blocks
          : blocks.filter((block) =>
              blockMatches(block, {
                fromWallet,
                toWallet,
                atomicAmount,
                createdAt,
              }),
            );

      if (candidateBlocks.length) {
        return (
          candidateBlocks[0].hash?.toString?.() ??
          String(candidateBlocks[0].hash)
        );
      }
    }
  } catch (error) {
    console.warn(`history lookup failed for ${wallet}: ${error.message}`);
  }

  return undefined;
}

function blockMatches(
  block,
  { fromWallet, toWallet, atomicAmount, createdAt },
) {
  const json = toBlockJson(block);
  const data = JSON.stringify(json);
  const account = json?.account ? String(json.account) : "";
  const blockDate = json?.date ? new Date(json.date).getTime() : undefined;
  const operations = Array.isArray(json?.operations) ? json.operations : [];
  const hasMatchingSend = operations.some((operation) => {
    const amount = operationAmountToBigInt(operation?.amount);
    const to = operation?.to === undefined ? "" : String(operation.to);
    return amount === atomicAmount && (!toWallet || sameHash(to, toWallet));
  });

  return (
    (hasMatchingSend &&
      (!fromWallet || sameHash(account, fromWallet)) &&
      isNearDate(blockDate, createdAt)) ||
    (data.includes(String(atomicAmount)) &&
      (!fromWallet ||
        sameHash(account, fromWallet) ||
        data.includes(fromWallet)) &&
      (!toWallet || data.includes(toWallet)) &&
      isNearDate(blockDate, createdAt))
  );
}

function isNearDate(blockDate, createdAt) {
  if (!blockDate || !createdAt) return true;
  return Math.abs(blockDate - createdAt) <= 10 * 60 * 1000;
}

function toBlockJson(block) {
  try {
    if (typeof block?.toJSON === "function") return block.toJSON();
    return block;
  } catch {
    return {};
  }
}

function sameHash(left, right) {
  return normalizeHash(left) === normalizeHash(right);
}

function normalizeHash(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function shortHash(value) {
  const text = String(value ?? "");
  if (text.length <= 14) return text;
  return `${text.slice(0, 8)}...${text.slice(-6)}`;
}

function toAtomicKta(amount) {
  const normalized = String(amount || "0").trim();
  if (!/^\d+(\.\d{1,9})?$/.test(normalized)) return 0n;
  const [whole, fractional = ""] = normalized.split(".");
  return BigInt(whole) * 1_000_000_000n + BigInt(fractional.padEnd(9, "0"));
}

function operationAmountToBigInt(amount) {
  if (amount === undefined || amount === null) return undefined;
  try {
    return BigInt(String(amount));
  } catch {
    return undefined;
  }
}

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1).replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
