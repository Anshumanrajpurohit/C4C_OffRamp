"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import styled, { css } from "styled-components";

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
          <svg className="icon" viewBox="0 0 48 48" role="presentation" focusable="false">
            <path
              fill="currentColor"
              d="M12 39c-.549 0-1.095-.15-1.578-.447A3.008 3.008 0 0 1 9 36V12c0-1.041.54-2.007 1.422-2.553a3.014 3.014 0 0 1 2.919-.132l24 12a3.003 3.003 0 0 1 0 5.37l-24 12c-.42.21-.885.315-1.341.315z"
            />
          </svg>
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
  --cta-bg: linear-gradient(135deg, #15ccbe, #0f988e);
  --cta-border: #0f988e;
  --cta-color: #ffffff;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  min-width: 11.5rem;
  padding: 0 2.25rem 0 1.25rem;
  height: 3.4rem;
  border-radius: 999px;
  border: 1px solid var(--cta-border);
  background: var(--cta-bg);
  color: var(--cta-color);
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.3);
  cursor: pointer;
  position: relative;
  box-shadow:
    inset 0 30px 30px -15px rgba(255, 255, 255, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.35),
    0 3px 0 #0f988e,
    0 5px 10px rgba(0, 0, 0, 0.18),
    0 10px 22px rgba(0, 0, 0, 0.12);
  transition: transform 150ms ease-in-out, box-shadow 150ms ease-in-out;
  font-family: var(--font-plus-jakarta, var(--font-geist-sans), "Istok Web", sans-serif);

  .cta-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.9rem;
    height: 1.9rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
    transition: transform 0.5s ease-in-out;
  }

  .icon {
    width: 1.35rem;
    height: 1.35rem;
    display: block;
  }

  .cta-text {
    transition: transform 0.5s ease-in-out;
    white-space: nowrap;
  }

  &:hover .cta-text {
    transform: translateX(72px);
  }

  &:hover .cta-icon {
    transform: translateX(26px);
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
      --cta-border: rgba(15, 152, 142, 0.4);
      --cta-color: #0f4d3a;
      box-shadow:
        inset 0 18px 24px -18px rgba(15, 152, 142, 0.25),
        0 3px 0 rgba(15, 152, 142, 0.35),
        0 8px 18px rgba(15, 152, 142, 0.18);

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
