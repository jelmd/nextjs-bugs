/*
 * The contents of this file are subject to the terms of the
 * Common Development and Distribution License (the "License") 1.1!
 * You may not use this file except in compliance with the License.
 *
 * See  https://spdx.org/licenses/CDDL-1.1.html  for the specific
 * language governing permissions and limitations under the License.
 *
 * Copyright 2023 Jens Elkner (jel+nextjs-bugs@linofee.org)
 */
'use strict';

import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";
import { DefaultJWT } from "next-auth/jwt";

// nextauth.d.ts

export interface UserExt {
	// we do NOT want the user ID exposed here, but perhaps a tmpID. which gets
	// wired to state.
	tid: number,
	firstname?: string,
	middlename?: string | null,
	lastname?: string,
	nickname?: string,
	lang?: string | null,
	role?: Role,
	// last modification time on the server. Gets set on session.update() and
	// session.authorize(). Tracked on the server to auto update outdated
	// token and session data.
	lm: number
}

declare module "next-auth" {
	/* next-auth removed the 'DefaultUser' interface in v5 (why?), so we need to
	   duplicate 'User' as 'DefaultUser' to be able to overwrite the 'User'
	   interface */
	interface DefaultUser {
		id?: string
		name?: string | null
		email?: string | null
		image?: string | null
	}

	interface UserInfo extends DefaultUser, UserExt{}

	interface User extends UserInfo{}

	interface Session extends DefaultSession {	// eslint-disable-line
		user?: User
	}
}

declare module "@auth/core/jwt" {
	/**
	 * The the final JWT, which floats around between client and server. In addition
	 * to JWT it contains:
	 * @param iat	Time of the token was issued or refreshed at (as unix time).
	 * @param exp	Time the token expires (as unix time). Usually iat + maxAge.
	 * @param jti	Unique id of the token.
	 * @param uid	The User ID.
	 * @param firstname	The firstname of the user.
	 * @param nickname	The nickname of the user.
	 */
	interface JWT extends DefaultJWT, UserExt {	// eslint-disable-line
		// all state info, which should not be exposed to the client
		uid: number
	}
}
