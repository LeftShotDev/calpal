"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import React from "react";

import classNames from "@calcom/ui/classNames";

export function Tooltip({
	children,
	content,
	open,
	defaultOpen,
	onOpenChange,
	delayDuration,
	side = "top",
	...props
}: {
	children: React.ReactNode;
	content: React.ReactNode;
	delayDuration?: number;
	open?: boolean;
	defaultOpen?: boolean;
	side?: "top" | "right" | "bottom" | "left";
	onOpenChange?: (open: boolean) => void;
} & TooltipPrimitive.TooltipContentProps) {
	const Content = (
		<TooltipPrimitive.Content
			{...props}
			className={classNames(
				"calcom-tooltip",
				side === "top" && "-mt-7",
				side === "left" && "mr-2",
				side === "right" && "ml-2",
				"bg-inverted text-inverted relative z-50 rounded-sm px-2 py-1 text-xs font-semibold shadow-lg",
				props.className && `${props.className}`
			)}
			side={side}
			align="center">
			{content}
		</TooltipPrimitive.Content>
	);

	// React 19 compatibility workaround for Radix UI's asChild prop
	// Radix UI internally accesses element.ref which is deprecated in React 19
	// We clone the element to ensure refs are handled as props rather than accessed via element.ref
	const triggerElement = React.isValidElement(children)
		? React.cloneElement(children as React.ReactElement, {
			// Spread existing props to ensure React 19 compatibility
			// This ensures ref is handled as a prop, not accessed via the deprecated element.ref
			...(children as React.ReactElement).props,
		})
		: children;

	return (
		<TooltipPrimitive.Root
			delayDuration={delayDuration || 50}
			open={open}
			defaultOpen={defaultOpen}
			onOpenChange={onOpenChange}>
			<TooltipPrimitive.Trigger asChild>
				{triggerElement}
			</TooltipPrimitive.Trigger>
			<TooltipPrimitive.Portal>{Content}</TooltipPrimitive.Portal>
		</TooltipPrimitive.Root>
	);
}

export default Tooltip;
