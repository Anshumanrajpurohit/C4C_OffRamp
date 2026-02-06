"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import styled, { css } from "styled-components";

export type PrimaryCTAButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: React.ElementType;
  variant?: "default" | "ghost";
};

export const PrimaryCTAButton = forwardRef<HTMLButtonElement, PrimaryCTAButtonProps>(
  ({ children, variant = "default", ...rest }, ref) => {
    return (
      <StyledPrimaryCTAButton ref={ref} $variant={variant} {...rest}>
        <span>{children}</span>
      </StyledPrimaryCTAButton>
    );
  },
);

PrimaryCTAButton.displayName = "PrimaryCTAButton";

export function PrimaryCTAExamples() {
  return (
    <ExamplesWrapper>
      <PrimaryCTAButton>Start Your Swap</PrimaryCTAButton>

    </ExamplesWrapper>
  );
}

const StyledPrimaryCTAButton = styled.button<{ $variant: "default" | "ghost" }>`
  --color1: #d08721;
  --color2: #e8bf29;
  --depth: 18px;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 12rem;
  padding: 1.56rem 2.8rem;
  border: none;
  border-radius: 0px;
  background: linear-gradient(var(--color1), var(--color2));
  color: #ffffff;
  font-size: 1.56rem;
  font-weight: 1000;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  text-shadow: 0 10px 12px rgba(0, 0, 0, 0.45);
  cursor: pointer;
  transform-style: preserve-3d;
  transform: perspective(950px) rotateX(68deg) rotateZ(26deg);
  transition: transform 0.45s cubic-bezier(0.19, 1, 0.22, 1);
  box-shadow: 0 24px 28px -18px rgba(18, 55, 30, 0.65);
  will-change: transform;

  span {
    position: relative;
    z-index: 2;
    white-space: nowrap;
  }

  &::before {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: var(--depth);
    background-color: var(--color2);
    transform: rotateX(90deg);
    transform-origin: bottom;
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: var(--depth);
    height: 100%;
    background-color: var(--color1);
    transform: rotateY(-90deg);
    transform-origin: right;
  }

  &:hover {
    transform: perspective(950px) rotateX(32deg) rotateZ(0deg) translateY(-4px);
  }

  &:active {
    transform: perspective(950px) rotateX(24deg) rotateZ(0deg) translateY(-2px);
  }

  &:focus-visible {
    outline: 3px solid rgba(143, 233, 176, 0.85);
    outline-offset: 6px;
  }

  &:disabled {
    cursor: not-allowed;
    filter: grayscale(0.3) brightness(0.85);
  }

  ${({ $variant }) =>
    $variant === "ghost" &&
    css`
      --color1: #f1fff6;
      --color2: #d6f0dc;
      color: #1a8516;
      text-shadow: none;
      box-shadow: 0 22px 26px -20px rgba(26, 133, 22, 0.35);

      &:hover {
        transform: perspective(950px) rotateX(30deg) rotateZ(0deg) translateY(-4px);
      }

      &:active {
        transform: perspective(950px) rotateX(22deg) rotateZ(0deg) translateY(-2px);
      }
    `}
`;

const ExamplesWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
`;

export default PrimaryCTAButton;
