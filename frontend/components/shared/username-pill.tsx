function UsernamePill({ username, variant = "accent" }: { username: string; variant?: "accent" | "sky" }) {
	return <span className={variant === "accent" ? "rounded-full bg-accent/15 px-2 py-1 font-bold text-accent" : "rounded-full bg-sky/15 px-2 py-1 font-bold text-sky"}>@{username}</span>;
}

export default UsernamePill;