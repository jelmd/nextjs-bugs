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

import Link from "next/link"

export default function GET() {

	//document.title = 'Dashboard';

	return (
		<>
			<title>Dashboard</title>
			<div>Hello World</div>
			<Link href='/' >Go Home</Link>
		</>
	);
}
