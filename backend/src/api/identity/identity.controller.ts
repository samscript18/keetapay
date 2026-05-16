import { Body, Controller, Post } from "@nestjs/common";
import { IdentityCertificate } from "./identity.types";
import { IdentityService } from "./identity.service";

@Controller("identity")
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post("request-selective-disclosure")
  requestSelectiveDisclosure() {
    return this.identityService.requestSelectiveDisclosure();
  }

  @Post("verify-disclosure")
  verifyDisclosure() {
    return this.identityService.verifyDisclosure();
  }

  @Post("verify-certificate")
  verifyCertificate(@Body() certificate: IdentityCertificate) {
    return this.identityService.verifyCertificate(certificate);
  }
}
