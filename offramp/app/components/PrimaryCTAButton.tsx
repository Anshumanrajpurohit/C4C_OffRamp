"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import styled, { css } from "styled-components";
import icon from '@/public/assets/btn-icn.png'

export type PrimaryCTAButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: React.ElementType;
  variant?: "default" | "ghost";
  href?: string;
};

export const PrimaryCTAButton = forwardRef<HTMLButtonElement, PrimaryCTAButtonProps>(
  ({ children, variant = "default", ...rest }, ref) => {
    return (
      <StyledPrimaryCTAButton ref={ref} $variant={variant} {...rest}>
        <span className="cta-icon" aria-hidden="true">
          <img src={icon.src} alt="" className="icon" />
        </span>
        <span className="cta-text">{children}</span>
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
  --cta-bg: #FF6B35;
  --cta-border: #DE5C2D;
  --cta-color: #ffffff;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  min-width: 14rem;
  padding: 0 2.75rem 0 1.75rem;
  height: 4.2rem;
  border-radius: 999px;
  border: 1px solid var(--cta-border);
  background: var(--cta-bg);
  color: var(--cta-color);
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.3);
  cursor: pointer;
  position: relative;
  box-shadow: rgba(255, 110, 0 , 0.9) 5px 5px, rgba(255, 110, 0 , 0.9) 10px 10px, rgba(255, 110, 0 , 0.9) 15px 15px,;
  transition: transform 150ms ease-in-out, box-shadow 150ms ease-in-out;
  font-family: var(--font-plus-jakarta, var(--font-geist-sans), "Istok Web", sans-serif);

  .cta-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
    transition: transform 0.5s ease-in-out;
  }

  .icon {
    width: 10rem;
    height: 2.55rem;
    display: block;
  }

  .cta-text {
    transition: transform 0.5s ease-in-out;
    white-space: nowrap;
  }

  &:hover .cta-text {
    transform: translateX(300px);
  }

  &:hover .cta-icon {
    transform: translateX(106px);
  }

  &:hover {
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(3px);
    box-shadow:
      inset 0 16px 2px -15px rgba(0, 0, 0, 0),
      inset 0 0 0 1px rgba(255, 255, 255, 0.15),
      inset 0 1px 20px rgba(0, 0, 0, 0.08),
      0 0 0 #0f988e,
      0 0 0 2px rgba(255, 255, 255, 0.4);
  }

  &:focus-visible {
    outline: 3px solid rgba(21, 204, 190, 0.4);
    outline-offset: 4px;
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  ${({ $variant }) =>
    $variant === "ghost" &&
    css`
      --cta-bg: #ffffff;
      --cta-border: rgba(255, 110, 0, 0.4);
      --cta-color: #0f4d3a;
      box-shadow: rgba(0, 0, 0, 0.15) 0px 15px 25px, rgba(0, 0, 0, 0.05) 0px 5px 10px;

      .cta-icon {
        background: rgba(15, 152, 142, 0.12);
        color: #0f988e;
      }

      &:hover {
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(2px);
      }
    `}
`;

const ExamplesWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
`;

export default PrimaryCTAButton;
