/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author WandersonChaves                                                             │
 * │ @filename auth.guard.ts                                                      │
 * │ Developed by: Wanderson Chaves                                                  │
 * │ Creation date: Nov 27, 2022                                                  │
 * │ Contact: contatochaves@gmail.com                                                │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @copyright © Wanderson Chaves 2022. All rights reserved.                        │
 * │ Licensed under the Apache License, Version 2.0                               │
 * │                                                                              │
 * │  @license "https://github.com/wandersonchaves/whatsapp-api/blob/main/LICENSE"   │
 * │                                                                              │
 * │ You may not use this file except in compliance with the License.             │
 * │ You may obtain a copy of the License at                                      │
 * │                                                                              │
 * │    http://www.apache.org/licenses/LICENSE-2.0                                │
 * │                                                                              │
 * │ Unless required by applicable law or agreed to in writing, software          │
 * │ distributed under the License is distributed on an "AS IS" BASIS,            │
 * │ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     │
 * │                                                                              │
 * │ See the License for the specific language governing permissions and          │
 * │ limitations under the License.                                               │
 * │                                                                              │
 * │ @function jwtGuard                                                           │
 * │ @property {Request} req @property {Response} _ @property {NextFunction} next │
 * │ @returns {Promise<void>}                                                     │
 * │                                                                              │
 * │ @function apikey                                                             │
 * │ @property {Request} req @property {Response} _ @property {NextFunction} next │
 * │ @returns {Promise<void>}                                                     │
 * │                                                                              │
 * │ @constant authGuard                                                          │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import {Auth, ConfigService} from '../config/env.config'
import {ForbiddenException, UnauthorizedException} from '../exceptions'
import {NextFunction, Request, Response} from 'express'

import {InstanceDto} from '../whatsapp/dto/instance.dto'
import {JwtPayload} from '../whatsapp/services/instance.service'
import {Logger} from '../config/logger.config'
import {isJWT} from 'class-validator'
import jwt from 'jsonwebtoken'
import {name} from '../../package.json'

export class JwtGuard {
  constructor(private readonly configService: ConfigService) {}

  private readonly logger = new Logger(this.configService, JwtGuard.name)

  async canActivate(req: Request, _: Response, next: NextFunction) {
    const key = req.get('apikey')

    if (
      this.configService.get<Auth>('AUTHENTICATION').GLOBAL_AUTH_TOKEN === key
    ) {
      return next()
    }

    if (
      (req.originalUrl.includes('/instance/create') ||
        req.originalUrl.includes('/instance/fetchInstances')) &&
      !key
    ) {
      throw new ForbiddenException(
        'Missing global api key',
        'The global api key must be set',
      )
    }

    if (req.originalUrl.includes('/instance/qrcode')) {
      return next()
    }

    const jwtOpts = this.configService.get<Auth>('AUTHENTICATION').JWT
    try {
      const [bearer, token] = req.get('authorization')?.split(' ')

      if (bearer.toLowerCase() !== 'bearer') {
        throw new UnauthorizedException()
      }

      if (!isJWT(token)) {
        throw new UnauthorizedException()
      }

      const param = req.params as unknown as InstanceDto
      const decode = jwt.verify(token, jwtOpts.SECRET, {
        ignoreExpiration: jwtOpts.EXPIRIN_IN === 0,
      }) as JwtPayload

      if (
        param.instanceName !== decode.instanceName ||
        name !== decode.apiName
      ) {
        throw new UnauthorizedException()
      }

      return next()
    } catch (error) {
      this.logger.error(error)
      throw new UnauthorizedException()
    }
  }
}
