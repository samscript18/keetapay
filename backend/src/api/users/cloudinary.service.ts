import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import type { Multer } from "multer";

@Injectable()
export class CloudinaryService {
  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.getOrThrow<string>("CLOUDINARY_CLOUD_NAME"),
      api_key: this.config.getOrThrow<string>("CLOUDINARY_API_KEY"),
      api_secret: this.config.getOrThrow<string>("CLOUDINARY_API_SECRET"),
    });
  }

  async uploadAvatar(file: Express.Multer.File) {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: "keetapay",
          allowed_formats: ["jpg", "png", "jpeg", "webp"],
          public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
          secure: true,
          resource_type: "image",
          transformation: [
            { width: 512, height: 512, crop: "fill", gravity: "face:auto" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else if (!result)
            reject(
              new InternalServerErrorException("Cloudinary upload failed"),
            );
          else resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(upload);
    });
  }
}
