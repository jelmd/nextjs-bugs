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

import { GlobalCtxProvider } from "@/components/global_ctx";
import EnsureSession from "@/components/session";
import { SESSION_TIMEOUT } from "@/lib/utils";
import { SessionProvider } from "next-auth/react";
import React, { StrictMode } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
	let s = process.env['APP_CONTEXT'] ?? '';
	s = s.trim();
	const APP_CONTEXT = s.startsWith('/') ? s.substring(1) : s;

	return (
		<StrictMode>
		<GlobalCtxProvider>
			<SessionProvider
				refetchInterval={SESSION_TIMEOUT} basePath={APP_CONTEXT}>
				<EnsureSession>
					<html lang="de">
						<body>{children}</body>
					</html>
				</EnsureSession>
			</SessionProvider>
		</GlobalCtxProvider>
		</StrictMode>
	);
}
