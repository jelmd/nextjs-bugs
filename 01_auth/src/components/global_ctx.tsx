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

import React, { createContext, PropsWithChildren, useState } from "react";

// components/global_ctx.tsx

const DEBUG = true;

export interface GlobalCtxType {
	navbarVisible: boolean,
	navbarToggle: () => void
}

// for whatever reason React wants to have default values for every context.
const GlobalCtx = createContext<GlobalCtxType>({
	navbarVisible: false,
	navbarToggle: () => {}
});

export default GlobalCtx;

export function GlobalCtxProvider(props: PropsWithChildren) {
	// NOTE: It is not allowed to call setState() functions from another component.
	const [navbarVisible, setNavbarVisible] = useState(false);

	/**
	 * Toggle the visibility of the Navbar.
	 */
	const toggleNavbar = () => {
		setNavbarVisible((prev) => {
			if (DEBUG) console.log('toggleNavbar: ' + prev + ' => ' + !prev);
			return !prev;
		});
	};

	const context = {
		navbarVisible: navbarVisible,
		navbarToggle: toggleNavbar
	} as GlobalCtxType;

	return (
		<GlobalCtx.Provider value={context}>
			{props.children}
		</GlobalCtx.Provider>
	);
}
