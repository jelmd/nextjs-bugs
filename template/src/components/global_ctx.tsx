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

import React, { createContext, PropsWithChildren, useRef, useState } from "react";
import { UserInfo } from "@/nextauth";

// components/global_ctx.tsx

const DEBUG = true;

export interface AppUser extends UserInfo {}

export interface GlobalCtxType {
	navbarVisible: boolean,
	navbarToggle: () => void,
	user: React.MutableRefObject<AppUser>|null,
	userUpdate: (user: AppUser|undefined) => void	// eslint-disable-line
}

// for whatever reason React wants to have default values for every context.
const GlobalCtx = createContext<GlobalCtxType>({
	navbarVisible: false,
	navbarToggle: () => {},
	user: null,
	// @ts-ignore
	userUpdate: (ApUser) => {},		// eslint-disable-line
});

export default GlobalCtx;

export function GlobalCtxProvider(props: PropsWithChildren) {
	// NOTE: It is not allowed to call setState() functions from another component.
	const [navbarVisible, setNavbarVisible] = useState(false);
	// So to avoid any trouble we do not use state here. Usually EnsureSession
	// (which does the update) will triger a re-render anyway.
	const userRef = useRef({} as AppUser);

	/**
	 * Toggle hte visibility of the Navbar.
	 */
	const toggleNavbar = () => {
		setNavbarVisible((prev) => {
			if (DEBUG) console.log('toggleNavbar: ' + prev + ' => ' + !prev);
			return !prev;
		});
	};

	/**
	 * Update the AppUser properties as needed.
	 *
	 * @param user Update the current app user. Any properties having the value
	 * 		`null` get ignored, i.e. this property of the AppUser stays as is.
	 */
	const updateUser = (newuser: AppUser|undefined) => {
		if (!newuser || (userRef && userRef.current.lm === newuser.lm))
			return;
		userRef.current = userRef.current
			? Object.assign(userRef.current, newuser)
			: { ...newuser };
	};

	const context = {
		navbarVisible: navbarVisible,
		navbarToggle: toggleNavbar,
		user: userRef,
		userUpdate: updateUser
	} as GlobalCtxType;

	return (
		<GlobalCtx.Provider value={context}>
			{props.children}
		</GlobalCtx.Provider>
	);
}