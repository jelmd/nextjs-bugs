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

// lib/prisma.ts

/**
 * This file contains the all [helper] functions accessing the DB. It makes it
 * easier to adapt to DB changes or migrations and reduce try/catch canons.
 */
import { Prisma, PrismaClient, User } from "@prisma/client";
import type { Adapter } from "next-auth/adapters";
import { MAX_NAME_LEN, MIN_LEN, isPrintable, toLowerAscii } from "./utils";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { HTTP } from "./httpcodes";

const globalForPrisma = global as unknown as {
	prisma: PrismaClient | undefined
};

// because PC logs thrown errors to stdout, we tell it to not log errors. If
// needed, we do it by ourselves.
const prisma = globalForPrisma.prisma ?? new PrismaClient({
	log: [
		'query',	// comment this out to avoid query logging
		'info',
		'warn'
	],
	transactionOptions: {
		isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
	}
});

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}

export function getDbAdapter(): Adapter {
	return PrismaAdapter(prisma);
}

// misc. functions
export interface PrismaException {
	name: string;
	error: string,
	http: number,
	message: string,
	key: string | null,
	code: string
}

export interface PrismaUser extends User {}

/**
 * Normalize the given [Prisma] Error to something easy to handle.
 * @param e		Error to check.
 * @returns		a normalized Error with a useable unbloated message.
 */
export function normalizeException(e: Error | unknown): PrismaException {
	var ex:PrismaException = {
		name: '',
		error: '-',
		http: HTTP.INTERNAL_SERVER_ERROR,
		message: '',
		key: null,
		code: ''
	};
	if (e instanceof Error) {
		ex.message = e.message;
	} else {
		console.error('Non-Error exception', e);
		return ex;
	}
	if (e instanceof Prisma.PrismaClientInitializationError) {
		let x = e as Prisma.PrismaClientInitializationError;
		ex.error = x.errorCode ?? '';
		ex.name = 'Initialization';
		ex.http = HTTP.SERVICE_UNAVAILABLE;
		ex.code = x.errorCode ?? '';
	} else if (e instanceof Prisma.PrismaClientKnownRequestError) {
		let y = e as Prisma.PrismaClientKnownRequestError;
		ex.error = y.code.trim();
		ex.name = 'KnownRequest';
		if ((ex.error == 'P2002') && y.meta) { // uniqe constraint violation
			let t = (y.meta['target'] as string).trim();
			ex.key = t.endsWith('_key') ? t.substring(0, t.length - 4) : t;
		}
		ex.code = y.code ?? '';
	} else if (e instanceof Prisma.PrismaClientRustPanicError) {
		//var z = e as Prisma.PrismaClientRustPanicError;
		ex.name = 'RustPanic';
	} else if (e instanceof Prisma.PrismaClientUnknownRequestError) {
		//var u = e as Prisma.PrismaClientUnknownRequestError;
		ex.name = 'UnknownRequest';
	} else if (e instanceof Prisma.PrismaClientValidationError) {
		//var v = e as Prisma.PrismaClientValidationError;
		ex.name = 'Validation';
		http: HTTP.BAD_REQUEST;
		console.warn('####', e);
		ex.name = 'Unknown';
	}
	ex.name = 'PrismaClient' + ex.name + 'Error';
	ex.message = (ex.code.length ? (ex.code + ': ') : '')
		+ ex.message.replaceAll(new RegExp('[\n]+', 'g'), '\n').trim();
	return ex;
}

/**
 * Create a Prisma `where` clause to get the user associated with the given ID.
 * @param id The ID of the user, i.e. either a number (UID) (as number or string),
 * 		or an account name. If not a number, the string gets normalized first.
 * @returns `null` for an invalid ID the where clause to use otherwise.
 */
function id2clause(id: string|number|null): Prisma.UserWhereInput|null {
	if (!id)
		return null;

	let x : Prisma.UserWhereInput;
	if (typeof id !== 'number') {
		id = id.normalize("NFC").trim();
		if (id.length < MIN_LEN)
			return null;

		let ok = false;
		if (id.match("^[0-9]+$")) {	// all numbers
			ok = id.length > 12;
			x = { id: ok ? 0 : parseInt(id) };
		} else {								// account name
			if (id.length < MAX_NAME_LEN)
				ok = id === toLowerAscii(id);
			x = { account: ok && isPrintable(id, false) ? id : '.xxx' };	// . is not allowed
		}
		if (!ok)
			return null;
	} else if (id == 0) {
		return null;
	} else {
		x = { id: id };
	}
	return x;
}

/**
 * Find a user by an ID. It does not filter for anything else, just the ID.
 *
 * @param id An email address, or a player number, or nickname prefixed with a
 * 		single dot, or an account name. Before it gets used, it gets trimmed,
 * 		normalized and a check wrt. allowed valid characters is made. If it
 * 		represents a nickname, more than a singöe record might match. In this
 * 		case the first record found gets returned.
 * 		If invalid, `null` gets returned.
 * @returns The user found on success, `null` otherwise.
 */
export async function findUserFull(id: string|number|null): Promise<User | null> {
	var clause = id2clause(id);
	if (!clause)
		return null;

	return prisma.user.findFirst({ where: clause})
		.catch((e) => {
			console.warn(normalizeException(e).message);
			return null;
		});
}