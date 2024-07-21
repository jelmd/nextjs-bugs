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

import { UserInfo } from "@/nextauth";

// lib/utils.ts

/**
 * The interval in seconds a client should refresh its session.
 */
export const SESSION_TIMEOUT = 5 * 60000;

/**
 * Delete any session which didn't got refreshed for this number of seconds.
 */
export const SESSION_MAX_AGE = 6 * 3600000;

/**
 * Restrict when to update the expiration record for a session within the DB.
 * The session gets refreshed every `SESSION_TIMEOUT` seconds. To avoid useless
 * pressure on the DB, one could defer the DB update 'til the end of the given
 * interval in seconds. So should be `< (SESSION_MAX_AGE - 2 * SESSION_TIMEOUT)'
 */
export const SESSION_DB_UPDATE_INTERVALL = 3600000;

/** Max. length in characters of an email address we allow */
export const MAX_EMAIL_LEN = 63;
/** Max. length in characters of a users first, last and account name */
export const MAX_NAME_LEN = 31;
/** The max. number of characters of a password no matter wether encoded or not. */
export const MAX_PASSWORD_LEN = 127;
/** The minimum length of an item to be considered valid. */
export const MIN_LEN = 2;
/** The minimum number of characters of an account name. */
export const MIN_ACCOUNT_LEN = 4;
/** The minimum number of characters a password must have */
export const MIN_PASSWORD_LEN = 8;

/**
 * Convert the given string into an integer.
 *
 * @param str The string to convert. If the argument is not a string, the
 * 	fallback gets returned.
 * @param fallback The value to return on error.
 * @return fallback on error or NaN, the parsed integer otherwise.
 */
export function str2int(str: any, fallback: number) {
	if (Number.isInteger(str))
		return str as number;
	if (typeof str === 'string') {
		try {
			let x = parseInt(str);
			return isNaN(x) ? fallback : x;
		} catch {}
	}
	return fallback;
}

/**
 * Convert the given string to lower ASCII characters (a-z0-9). Non-ascii
 * characters get silently omitted, whereby german umlaute (ä, ö, ü) get translated
 * to `ae`, `oe`, or `ue` respectively and the ß to `sz`.
 *
 * @param s string to convert.
 * @returns a possibly empty string.
 */
export function toLowerAscii(s: string): string {
	if (!s)
		return "";

	let i;
	let t = "";
	for (i=0; i < s.length; i++) {
		let c = s.charCodeAt(i);
		if ((c > 47 && c < 58) || (c > 96 && c < 123))
			t += s.charAt(i);
		else if (c == 228) {
			t += "ae";
		} else if (c == 246) {
			t += "oe";
		} else if (c == 252) {
			t += "ue";
		} else if (c == 223) {
			t += "sz";
		}
	}
	return t;
}

/**
 * Check whether the given str represents an email address which is RFC 5322
 * conform. To keep it simple and avoid translation errors the following
 * simplifications are made:
 * - display name is not supported
 * - obsolete specs are not honored
 * - [content] folding whitespaces are not allowed
 * AND
 * - quoted-string is not allowed (and thus no control characters)
 * - domain-literal is not allowed
 *
 * @param str email address to check
 * @returns `true` if the given string is an RFC conform email address, `false`
 * 	otherwise.
 */
export function checkEmail(str: string): boolean {
	var idx = str.indexOf("@");
	if (idx == -1)
		return false;

	let localPart = str.substring(0, idx);
	// var atext = "[a-zA-Z0-9!#$%&'*+-/=?^_`{|}~]";
	// "^" + atext + "+(?:\." + atext + "+)*$"
	let dotatom = /^[-a-zA-Z0-9!#$%&'*+/=?^_`{|}~]+(?:\.[-a-zA-Z0-9!#$%&'*+/=?^_`{|}~]+)*$/;
	// even more simplified to avoid trouble with other languages
	// var dotatom = /^[-a-zA-Z0-9%&+=?_~]+(?:\.[-a-zA-Z0-9%&+=?_~]+)*$/ ;
	if (!dotatom.test(localPart))
		return false;
	let domain = str.substring(idx + 1);
	if (!dotatom.test(domain))
		return false;
	if (domain.length > 255)
		return false; // domain too long
	let label = domain.split("\.");
	let count = label.length - 1;
	if (count < 1 || label[count]!.length < 2 || label[count - 1]!.length < 2)
		return false; // top and 2nd level domain too short
	let domainLabel = /^[a-zA-Z0-9]+(?:-+[a-zA-Z0-9]+)*$/;
	for (; count >= 0; count--) {
		if (label[count]!.length > 63)
			return false; // subdomain too long
		if (!domainLabel.test(label[count]!))
			return false; // invalid characters
	}
	// even if numerical IPs are allowed, we choose to not accept them and avoid
	// CIDR check
	let tldIP = /[0-9]+$/;
	let allIP = /^[0-9]+(?:\.[0-9]+)*$/;
	return ! (tldIP.test(domain) || allIP.test(domain));
}

/**
 * Check whether the given UTF-8 string contains printable characters, only.
 *
 * @param s	string to check.
 * @param space_allowed		If true, the space character 0x20 gets accepted, too.
 * @return `false` if the given string contains one or more non-printable
 * 	characters, `true` otherwise.
 */
export function isPrintable(s: string, space_allowed: boolean): boolean {
	if (!s)
		return false;
	let start = space_allowed ? 32 : 33;
	for (let i=s.length - 1; i >= 0; i--) {
		let c = s.charCodeAt(i);
		if (c < start
			|| (c > 126 && c < 160) /* control chars */
			|| (c > 8191 && c < 8208) /* space and joiner stuff */
			|| (c > 8231 && c < 8240) /* separators and layout controls */
			|| (c > 8286 && c < 8304) /* space and layout controls */
			|| c == 12288 /* IDEOGRAPHIC SPACE */
			|| c == 65279 /* ZERO WIDTH NO-BREAK SPACE */ )
		{
			return false;
		}
	}
	return true;
}

/**
 * Get the given user's fullname.
 *
 * @param user 				Data containing firstname, middlename?, lastname.
 * @param firstIsFirst		Use firstname as the first component of the fullname.
 * @returns The user's fullname.
 */
export function getFullname(user: UserInfo, firstIsFirst?: boolean): string {
	if (!user)
		return '';

	if (firstIsFirst) {
		return user.firstname! + (user.middlename ? ' ' + user.middlename : '')
			+ ' ' + user.lastname;
	}

	return user.lastname + ', ' + user.firstname
		+ (user.middlename ? ' ' + user.middlename : '');
}

/**
 * Parse a comma separated list of numbers. No spaces are allowed.
 *
 * @param s A comma separated list of numbers or array of numbers as strings.
 * 		Any non-numbers get silently ignored.
 * @returns a possibly empty array of numbers.
 */
export function commastr2int(s: any) {
	var res: number[] = [];
	var val = (typeof s === 'string') ? s.split(',') : s ?? [];
	try {
		for (const t of val) {
			if (t.length == 0)
				continue;
			try {
				let n = parseInt(t);
				res.push(n);
			} catch (e) {
			}
		}
	} catch(e) {
		console.log('Invalid comma string ignored');
	}
	return res;
}