import { User, verifyToken } from '@clerk/backend';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AuthService {

    constructor(
        private readonly configService: ConfigService,
    ) { }

    async validate(req: Request): Promise<Request> {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            throw new UnauthorizedException('No token provided');
        }

        try {
            /*
            for production, you should use the public key from Clerk
                const client = new JwksClient({
                jwksUri: config.auth.zitadel.authJwksClient,
                cache: true,
                cacheMaxEntries: 5,
                cacheMaxAge: 3600000,
            });

            function getKey(header, callback) {
                client.getSigningKey(header.kid, (err, key) => {
                    if (err) {
                        callback(err);
                    } else {
                        const signingKey = key.getPublicKey();
                        callback(null, signingKey);
                    }
                });
            }
            */
            /*eslint-disable */
            const tokenPayload = await verifyToken(token, {
                jwtKey: this.configService.get('CLERK_PUBLIC_KEY'),
            });

            req = this.setPermissionsIntoRequestClerk(req, tokenPayload);
            /*eslint-enable */
            return req;
        } catch (error) {
            console.error(error);
            throw new UnauthorizedException('Invalid token');
        }
    }

    /*eslint-disable */
    setPermissionsIntoRequestClerk(req, decodedToken) {
        const permissionsArray = decodedToken.org_permissions || [];

        let dataRoles = permissionsArray.map((item) => {
            let splited = item.split(":");
            let merged = splited[1] + ":" + splited[2];
            let dashFix = merged.replace(/_/g, "-");
            return dashFix;
        });
        const currentUserRoles = dataRoles.length ? dataRoles : [];

        req.userPermissions = currentUserRoles;
        req.user = decodedToken;
        return req;
    }
    /*eslint-enable */
}

