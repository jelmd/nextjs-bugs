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
'use client';

import { signIn, signOut, useSession } from "next-auth/react";
import { redirect } from 'next/navigation';
import Link from 'next/link';

// app/page.tsx


export default function GET() {
	const { data: session, status } = useSession();
	if (status === 'loading') {
		return (
			<h1>Lade ...</h1>
		);
	}
	if (status === "authenticated") {
		document.title = 'Test-App';
		return (
			<>
			Signed in as {session?.user?.name} <br />
			<button type="button" onClick={() => signOut()}>Signout</button>
			<Link href="/db">Dashboard</Link>
			</>
		);
	}

	return (
		<>
	<title>Example</title>
	<meta name="description" content="Example App" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
<header>
	<div>
		<div><p>Header</p></div>
	</div>
</header>
<main>
	<div>
		<p>Not signed in.</p>
		<button type="button" onClick={() => signIn(undefined, {callbackUrl: '/db'})}>
			Login
		</button>
		<button type="button" onClick={() => redirect('/register')}>
			Register
		</button>
		<button type="button" onClick={() => redirect('/reset')}>
			Reset password
		</button>
	</div>
</main>
		</>
	);
}