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

// app/api/auth/[...nextauth]/config.js

import NextAuth, { NextAuthConfig, User } from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";

import { PrismaUser, findUserFull, getDbAdapter} from "@/lib/prisma";
import { generateHash } from "@/lib/crypto";
import { SESSION_DB_UPDATE_INTERVALL, SESSION_MAX_AGE } from "@/lib/utils";
import { Role } from "@prisma/client";
import { JWT } from "next-auth/jwt";

const id2lm = new Map<number,number>();

function prepareTokenData(user: PrismaUser, lm: number) {
	let res: User = {
		id: user.account,			// required to be a string.
		tid: 0,
		firstname: user.firstname,
		middlename: user.middlename,
		lastname: user.lastname,
		name: user.account,			// ¹
		nickname: user.nickname ?? '',
		role: user.role,
		lang: user.lang,
		email: '' + user.id,		// ¹
		image: user.image,			// ¹
		lm: lm === 0 ? Date.now() : lm
	};
	id2lm.set(user.id, res.lm);
	return res;
}

if (!process.env['NextAuth_SECRET']) {
	throw new Error('Please provide process.env.NextAuth_SECRET');
}

export const authOptions: NextAuthConfig = {
	debug: false,
	theme: { colorScheme: 'light' /* same as 'auto' */ },	// || 'dark'
	secret: process.env['NextAuth_SECRET'],
	session: {
		strategy: "jwt",
		maxAge: SESSION_MAX_AGE, // default: 30 days
		updateAge: SESSION_DB_UPDATE_INTERVALL,	// default: 24 hours
	},
	adapter: getDbAdapter(),
	providers: [
		CredentialsProvider({
			id: 'sha512',
			// display on the sign in form
			name: '',
			credentials: {
				account: {
					label: 'Account',
					type: 'text',
					placeholder: 'Enter your account name',
				},
				password: {
					label: 'Password',
					type: 'password',
					placeholder: 'Enter your password',
				}
			},
			async authorize(credentials) {
				if (!credentials)
					return null;

				const start = Date.now();
				let str = (credentials.account as string).trim();
				const user = await findUserFull(str);
				if (!user || !user.email
					|| user.deletedAt && user.deletedAt.getTime() <= Date.now())
				{
					return null;
				}
				if (!user.emailVerified)
					return null;

				const pw = generateHash(credentials.password as string, user.password);
				if (pw != user.password)
					return null;

				return prepareTokenData(user, start);
			}
		})
	],
	callbacks: {
		async signIn({ user }) {
			return !!user.id;
		},
		async jwt({ token, user, trigger /*, account, profile, isNewUser */}) {
			let lm = user ? user.lm : (id2lm.get(token.uid) ?? 0);	// logged out from another session
			if (token.uid && (trigger === 'update' || lm === 0 || token.lm < lm)) {
				let x = await findUserFull(token.uid);
				if (x) {
					user = prepareTokenData(x, trigger === 'update' ? 0 : lm);
				}
			}
			if (user) {
				token.tid = user.tid;
				token.uid = parseInt(user.email!);
				token.email = '';
				token.name = user.name ?? null;
				token.firstname = user.firstname ?? '';
				token.middlename = user.middlename ?? null;
				token.lastname = user.lastname ?? '';
				token.nickname = user.nickname ?? '';
				token.role = user.role ?? Role.ANONYMOUS;
				token.lang = user.lang ?? null;
				token.lm = user.lm;
			}
			// else other calls
			return token;
		},
		async session({ session, token }) {
			if (session.user && token && token.name) {
				// always contains user.{name,email,image} and expires, only!
				session.user.id = '' + token.tid;
				session.user.image = token.picture ?? null;
				session.user.name = token.name;
				session.user.firstname = token.firstname ?? '';
				session.user.middlename = token.middlename ?? null;
				session.user.lastname = token.lastname ?? '';
				session.user.nickname = token.nickname ?? '';
				session.user.role = token.role ?? Role.ANONYMOUS;
				session.user.lang = token.lang ?? null;
				session.user.lm = token.lm;
			}
			return session;
		},
		async redirect({ url, baseUrl }) {
			if (url.startsWith('/'))
				return `${baseUrl}${url}`;
			return (new URL(url).origin === baseUrl) ? url : baseUrl;
		},
	},
	pages: {	// default pages are provided by the framework
//		signIn: '/auth/signin',
//		signOut: '/auth/signout',
//		error: '/auth/error', // Error code passed in query string as ?error=
//		verifyRequest: '/auth/verify-request', // (used for check email message)
//		newUser: '/auth/new-user' // redirect new users here on 1st sign in
	},
	events: {
		async signOut(msg) {
			let token = (msg as { token: JWT | null; }).token;
			if (token) {
				id2lm.delete(token.uid);
				console.info('SIGNOUT: ' + token.uid);
			}
		},
		async signIn(msg) {
			console.info('SIGNIN: ' + msg.user.email);
		}
	}
};

export const {handlers, auth, signIn, signOut} = NextAuth(authOptions);