import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  KeyRound, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Radio, 
  Cpu, 
  ArrowRight,
  Server
} from 'lucide-react';
import { storageService, MOCK_AUTH_CREDENTIALS } from '../../services/storage';
import { UserPersona } from '../../types/inventory';
import confetti from 'canvas-confetti';

interface LoginPageProps {
  onLoginSuccess: (user: UserPersona) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // Quick 1-click Auto Fill for Demo Credentials
  const handleAutoFill = () => {
    setEmail(MOCK_AUTH_CREDENTIALS.email);
    setPassword(MOCK_AUTH_CREDENTIALS.password);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your SLT enterprise email address.');
      triggerShake();
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      triggerShake();
      return;
    }

    setIsLoading(true);
    setStatusMessage('Authenticating with SLT Central Directory...');

    // Multi-step realistic authentication sequence animation
    setTimeout(() => {
      setStatusMessage('Validating Operator Permissions & Tokens...');
      
      setTimeout(() => {
        const result = storageService.login(email, password);

        if (result.success && result.user) {
          setStatusMessage('Access Granted! Launching MatriX Node...');
          
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.65 },
              colors: ['#0056B3', '#00B4D8', '#43B02A'],
            });
          } catch {
            // Safe fallback if canvas not available
          }

          setTimeout(() => {
            setIsLoading(false);
            if (result.user) {
              onLoginSuccess(result.user);
            }
          }, 600);
        } else {
          setIsLoading(false);
          setStatusMessage('');
          setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
          triggerShake();
        }
      }, 700);
    }, 600);
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 550);
  };

  return (
    <div className="login-page-wrapper">
      {/* Dynamic Animated Floating Glowing Orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      {/* Futuristic Network Mesh Grid Overlay */}
      <div className="login-grid-overlay" />

      {/* Main Glassmorphic Login Card */}
      <div className={`login-card-glass ${isShaking ? 'login-shake' : ''}`}>
        {/* Top Header & SLT-MOBITEL Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 8, 
              padding: '6px 14px', 
              borderRadius: 30, 
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              marginBottom: 16
            }}
          >
            <div className="slt-pill-logo" style={{ transform: 'scale(0.95)' }}>
              <span className="slt-pill-blue" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>SLT</span>
              <span className="slt-pill-green" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>MOBITEL</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#BAE6FD', letterSpacing: '0.04em' }}>
              ENTERPRISE LOGISTICS
            </span>
          </div>

          <h1 
            style={{ 
              fontSize: '1.85rem', 
              fontWeight: 900, 
              color: '#FFFFFF', 
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(180deg, #FFFFFF 0%, #BAE6FD 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            SLT MatriX
          </h1>

          <p style={{ fontSize: '0.85rem', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
            Telecommunication Field & Warehouse Stock Intelligence
          </p>
        </div>

        {/* 1-Click Quick Demo Credentials Pill */}
        <div className="demo-badge-pill" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyRound size={16} style={{ color: '#00B4D8' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#BAE6FD', letterSpacing: '0.03em' }}>
                SUPER ADMIN (MR. KANISHKA)
              </div>
              <div style={{ fontSize: '0.75rem', color: '#E2E8F0', fontFamily: 'var(--font-mono)' }}>
                kanishka@slt.lk <span style={{ color: '#64748B' }}>/</span> slt123
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAutoFill}
            style={{
              border: 'none',
              background: 'linear-gradient(135deg, #0056B3, #00B4D8)',
              color: '#FFFFFF',
              borderRadius: 6,
              padding: '5px 10px',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 2px 8px rgba(0, 180, 216, 0.3)',
              transition: 'all 0.2s ease',
            }}
            title="Click to auto-fill kanishka@slt.lk and slt123"
          >
            <Zap size={12} />
            <span>Admin</span>
          </button>
        </div>

        {/* Quick Operator / Tech Accounts Selector */}
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700 }}>
            Or Login as Standard Technician / Operator (Password: tech123):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              { name: 'Sunil', email: 'sunil@slt.lk' },
              { name: 'Nuwan', email: 'nuwan@slt.lk' },
              { name: 'Chaminda', email: 'chaminda@slt.lk' },
              { name: 'Kasun', email: 'kasun@slt.lk' },
              { name: 'Dilshan', email: 'dilshan@slt.lk' },
            ].map(tech => (
              <button
                key={tech.email}
                type="button"
                onClick={() => {
                  setEmail(tech.email);
                  setPassword('tech123');
                  setErrorMessage(null);
                }}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: '1px solid #334155',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#CBD5E1',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tech.name}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 10,
              color: '#FCA5A5',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20,
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, color: '#EF4444' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Email Field */}
          <div>
            <label 
              htmlFor="slt-email" 
              style={{ 
                display: 'block', 
                fontSize: '0.8rem', 
                fontWeight: 700, 
                color: '#CBD5E1', 
                marginBottom: 6 
              }}
            >
              Enterprise Email / Username
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="slt-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kanishka@slt.lk"
                className="login-input"
                autoComplete="email"
                required
                disabled={isLoading}
              />
              <Mail 
                size={17} 
                style={{ 
                  position: 'absolute', 
                  left: 14, 
                  top: 15, 
                  color: '#64748B',
                  pointerEvents: 'none' 
                }} 
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label 
                htmlFor="slt-password" 
                style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: 700, 
                  color: '#CBD5E1' 
                }}
              >
                Account Password
              </label>
              <button
                type="button"
                onClick={() => {
                  alert("Please use default demonstration password: 'slt123' or contact SLT Enterprise IT Support (Ext: 4402).");
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00B4D8',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Forgot?
              </button>
            </div>
            
            <div style={{ position: 'relative' }}>
              <input
                id="slt-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="login-input"
                style={{ paddingRight: 42 }}
                autoComplete="current-password"
                required
                disabled={isLoading}
              />
              <Lock 
                size={17} 
                style={{ 
                  position: 'absolute', 
                  left: 14, 
                  top: 15, 
                  color: '#64748B',
                  pointerEvents: 'none' 
                }} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: 14,
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me Option */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: '#00B4D8',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Remember this terminal</span>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
              <span>TLS 1.3 Active</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="login-btn-submit"
            style={{ marginTop: 6 }}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span 
                  style={{ 
                    width: 18, 
                    height: 18, 
                    border: '2px solid rgba(255,255,255,0.3)', 
                    borderTopColor: '#FFFFFF', 
                    borderRadius: '50%', 
                    animation: 'spin 0.8s linear infinite' 
                  }} 
                />
                <span style={{ fontSize: '0.88rem' }}>{statusMessage || 'Verifying...'}</span>
              </div>
            ) : (
              <>
                <ShieldCheck size={19} />
                <span>Sign in to MatriX</span>
                <ArrowRight size={17} style={{ marginLeft: 2 }} />
              </>
            )}
          </button>
        </form>

        {/* Footer Security Badges */}
        <div 
          style={{ 
            marginTop: 26, 
            paddingTop: 18, 
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: '#64748B'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Server size={13} style={{ color: '#00B4D8' }} />
            <span>Depot Node: Lotus Rd (HQ)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Cpu size={13} style={{ color: '#43B02A' }} />
            <span>Dostocks v1.0 Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};
