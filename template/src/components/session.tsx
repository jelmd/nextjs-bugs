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

import { useSession } from "next-auth/react";
import { redirect, usePathname } from "next/navigation";
import React, { PropsWithChildren, useContext } from "react";
import GlobalCtx from "./global_ctx";

// components/session.tsx

/**
 * Ensure there is a session running when pages beneath /app/ are requested.
 * If not, just show a sign in message and stop the flow.
 * @param props page properties. Uses the auto generated `props.children` to
 * 	render the JSX componentens inside the `<EnsureSession>...</EnsureSession>`
 *  tag if a session exists and the user has loged in. Otherwise props.children
 *  get ignored.
 * @returns the page to render.
 */
export default function EnsureSession(props: PropsWithChildren) {
	const session = useSession();
	const ctx = useContext(GlobalCtx);
	const path = usePathname();

	if (session.status === 'loading') {
		return (
			<p>Loading ...</p>
		);
	}
	if ((session !== null && session.status === 'authenticated')
		|| (!path.startsWith('/db/') && path !== '/db'))
	{
		// We rely on userUpdate() that it does the right thing.
		ctx.userUpdate(session.data?.user);

		return (
			<>
				{props.children}
			</>
		);
	}

	redirect('/api/auth/signin');
}