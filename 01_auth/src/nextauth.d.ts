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

import { DefaultSession, DefaultUser } from "next-auth";
import { Role } from "@prisma/client";

// nextauth.d.ts

interface UserInfo extends DefaultUser {
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
	interface User extends UserInfo{}

	interface Session extends DefaultSession {	// eslint-disable-line
		user?: User
	}
}

declare module "next-auth/jwt" {
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
	interface JWT extends UserInfo {	// eslint-disable-line
		// all state info, which should not be exposed to the client
		uid: number
	}
}