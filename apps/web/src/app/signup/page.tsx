'use client';

import { useMemo, useState } from 'react';

type Step = 'launch' | 'signup' | 'verify' | 'wallet-1' | 'wallet-2' | 'wallet-3' | 'success';

const stepOrder: Step[] = ['launch', 'signup', 'verify', 'wallet-1', 'wallet-2', 'wallet-3', 'success'];

function DorriLogo() {
  return (
    <div className="dorri-logo" aria-label="HI-DORRI">
      <div className="petal one" />
      <div className="petal two" />
      <div className="petal three" />
      <div className="petal four" />
      <div className="logo-text">
        <span>
          Hi-
          <b className="logo-flower">*</b>
        </span>
        <span>DORRI</span>
      </div>
    </div>
  );
}

function LaunchScreen({ onNext }: { onNext: () => void }) {
  return (
    <main className="onboarding-shell" onClick={onNext}>
      <section className="phone" aria-label="HI-DORRI launch screen">
        <div className="screen center-screen">
          <div className="logo-stage">
            <DorriLogo />
          </div>
        </div>
      </section>
    </main>
  );
}

function SignupScreen({ onNext }: { onNext: () => void }) {
  return (
    <main className="onboarding-shell">
      <section className="phone" aria-label="Sign up">
        <div className="screen signup-screen">
          <h1 className="screen-title">Sign Up</h1>

          <div className="field">
            <label htmlFor="name">Name</label>
            <input className="input" id="name" placeholder="Enter your full name" />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input className="input" id="email" placeholder="name@example.com" type="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <input className="input" id="password" placeholder="Min. 8 characters" type="password" />
              <button className="eye-button" aria-label="Show password" type="button">
                o
              </button>
            </div>
          </div>

          <button className="primary-button" onClick={onNext} type="button">
            Continue
          </button>

          <div className="divider">Or sign up with</div>

          <div className="social-stack">
            <button className="secondary-button" type="button">
              <span>G</span>
              Sign up with Google
            </button>
            <button className="secondary-button" type="button">
              <span>A</span>
              Sign up with Apple
            </button>
          </div>

          <p className="auth-footer">
            Already have an account? <button className="link-button">Sign in</button>
          </p>
        </div>
      </section>
    </main>
  );
}

function VerifyScreen({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <main className="onboarding-shell">
      <section className="phone" aria-label="Verify email">
        <div className="screen verify-screen">
          <button className="back-button" onClick={onBack} type="button" aria-label="Back">
            &lt;
          </button>
          <div className="verify-content">
            <div className="mail-icon">@</div>
            <h1 className="verify-title">Verify Your Email</h1>
            <p className="verify-copy">
              We sent a verification code to
              <br />
              <strong>sarah@example.com</strong>
            </p>

            <div className="code-row" aria-label="6 digit verification code">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="code-box" key={index}>
                  *
                </div>
              ))}
            </div>
            <p className="resend">
              Didn&apos;t receive? <strong>Resend (58s)</strong>
            </p>

            <button className="primary-button" onClick={onNext} type="button">
              Verify
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function WalletCreatingScreen({ completedTasks, onNext }: { completedTasks: string[]; onNext: () => void }) {
  return (
    <main className="onboarding-shell">
      <section className="phone subtle" aria-label="Creating wallet">
        <div className="screen">
          <div className="wallet-progress">
            <h1 className="progress-title">Creating your wallet...</h1>
            <div className="spinner" />

            <div className="task-list">
              {completedTasks.map((task) => (
                <div className="task" key={task}>
                  <span className="task-check">v</span>
                  <span>{task}</span>
                </div>
              ))}
            </div>

            <div className="security-card">
              <span className="shield">S</span>
              <div>
                <strong>Safe &amp; Secure</strong>
                <span>Your private keys never leave your device.</span>
              </div>
            </div>
          </div>

          <button className="progress-footer" onClick={onNext} type="button">
            <span className="progress-dots">
              <span />
              <span />
              <span />
            </span>
            ALMOST THERE
          </button>
        </div>
      </section>
    </main>
  );
}

function SuccessScreen() {
  return (
    <main className="onboarding-shell">
      <section className="phone" aria-label="Wallet created">
        <div className="screen success-screen">
          <div className="success-topline" />
          <div className="success-content">
            <div className="success-icon">v</div>
            <h1 className="verify-title">Success!</h1>
            <p className="success-copy">Your DORRI Wallet is created successfully!</p>

            <div className="result-stack">
              <div className="address-card">
                <span className="card-label">YOUR XRPL ADDRESS</span>
                <div className="address-line">
                  <span>rSARAH123456789XRPLWALLEThj92</span>
                  <span className="copy-icon">[]</span>
                </div>
              </div>

              <div className="verified-card">
                <span className="mini-icon">V</span>
                <div>
                  <strong>Verified</strong>
                  <span>Validator NFT received</span>
                </div>
              </div>

              <div className="reserve-card">
                <strong>i Network Reserve</strong>
                <span>1.2 XRP locked by service</span>
                <div className="reserve-note">
                  <span>v</span>
                  You don&apos;t need to pay this!
                </div>
              </div>
            </div>

            <div className="success-action">
              <button className="primary-button" type="button">
                Get Started -&gt;
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function SignupPage() {
  const [step, setStep] = useState<Step>('launch');

  const completedTasks = useMemo(() => {
    if (step === 'wallet-1') {
      return ['Creating XRPL account...'];
    }

    if (step === 'wallet-2') {
      return ['Creating XRPL account...', 'Setting up DORRI token...'];
    }

    return ['Creating XRPL account...', 'Setting up DORRI token...', 'Minting Validator NFT...'];
  }, [step]);

  const goNext = () => {
    const index = stepOrder.indexOf(step);
    const nextStep = stepOrder[Math.min(index + 1, stepOrder.length - 1)] ?? 'success';
    setStep(nextStep);
  };

  const goBack = () => {
    const index = stepOrder.indexOf(step);
    const previousStep = stepOrder[Math.max(index - 1, 0)] ?? 'launch';
    setStep(previousStep);
  };

  if (step === 'launch') {
    return <LaunchScreen onNext={goNext} />;
  }

  if (step === 'signup') {
    return <SignupScreen onNext={goNext} />;
  }

  if (step === 'verify') {
    return <VerifyScreen onBack={goBack} onNext={goNext} />;
  }

  if (step === 'success') {
    return <SuccessScreen />;
  }

  return <WalletCreatingScreen completedTasks={completedTasks} onNext={goNext} />;
}
