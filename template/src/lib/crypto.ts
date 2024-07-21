import { createHash } from "crypto";

const DEBUG = false;
/**
 * Generate the hash for the given password.
 * **NOTE**: This implementation is just for testing stuff. The generated hash
 * uses neither a salt nor any strong hashing algorithm or rotation. So the hash
 * is pretty weak. Never ever use this in production!!!
 * For production use http://people.redhat.com/drepper/SHA-crypt.txt or something
 * like that.
 *
 * @param password plain text password to hash.
 * @param oldPassword ignored
 * @returns null if no or an empty password is given, the calculated password
 *      hash otherwise.
 */
export function generateHash(password: string, oldPassword?: string): string | null {
    if (!password || password.length == 0)
        return null;
	if (oldPassword && DEBUG)
		console.log('oldPW:' + oldPassword);
	let hash = createHash('sha512');
	hash.update(password);
	return hash.digest('hex').substring(0,126);
}
