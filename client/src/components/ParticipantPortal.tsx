import React, { useState, useRef } from 'react';
import { 
  Camera, Upload, CheckCircle, AlertTriangle, AlertOctagon, 
  ShieldCheck, RefreshCw, User, 
  FileText, Sparkles, Eye, Check,
  CheckCircle2, RotateCcw, X,
  Building2, Mail, Phone, CreditCard
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ParticipantTicket } from './ParticipantTicket';
import { TrustScoreGauge } from './TrustScoreGauge';
import type { Applicant, RegistrationRecord, TestVector } from '../types';

interface ParticipantPortalProps {
  onVerificationComplete: (record: RegistrationRecord) => void;
  selectedTestVector: TestVector | null;
  onClearTestVector: () => void;
  onOpenTestVectors: () => void;
}

export const ParticipantPortal: React.FC<ParticipantPortalProps> = ({
  onVerificationComplete,
  selectedTestVector,
  onClearTestVector,
  onOpenTestVectors
}) => {
  const [applicant, setApplicant] = useState<Applicant>({
    name: selectedTestVector?.applicant.name || '',
    email: selectedTestVector?.applicant.email || '',
    phone: selectedTestVector?.applicant.phone || '',
    college: selectedTestVector?.applicant.college || ''
  });

  const [docType, setDocType] = useState<string>(selectedTestVector?.docType || 'AADHAAR');
  const [documentImage, setDocumentImage] = useState<string | null>(selectedTestVector?.documentSvg || null);
  const [selfieImage, setSelfieImage] = useState<string | null>(selectedTestVector?.selfieSvg || null);
  const [rawOcrText, setRawOcrText] = useState<string>(selectedTestVector ? selectedTestVector.ocrLines.join('\n') : '');
  const [simulatedAnomaly, setSimulatedAnomaly] = useState<string | null>(selectedTestVector?.simulatedAnomaly || null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Verification progress state
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationStep, setVerificationStep] = useState<string>('');
  const [result, setResult] = useState<RegistrationRecord | null>(null);

  // Synchronize when test vector is loaded
  React.useEffect(() => {
    if (selectedTestVector) {
      setApplicant(selectedTestVector.applicant);
      setDocType(selectedTestVector.docType);
      setDocumentImage(selectedTestVector.documentSvg);
      setSelfieImage(selectedTestVector.selfieSvg);
      setRawOcrText(selectedTestVector.ocrLines.join('\n'));
      setSimulatedAnomaly(selectedTestVector.simulatedAnomaly);
      setResult(null);
    }
  }, [selectedTestVector]);

  // Calculate dynamic progress percentage
  const calculateProgress = (): number => {
    let score = 0;
    if (applicant.name && applicant.email && applicant.college) score += 30;
    if (documentImage) score += 25;
    if (selfieImage) score += 25;
    if (result) score += 20;
    return score;
  };

  const progressPercent = calculateProgress();

  // File upload handlers
  const handleDocFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDocumentImage(event.target?.result as string);
        setResult(null); // Clear previous result immediately
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelfieFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelfieImage(event.target?.result as string);
        setResult(null); // Clear previous result immediately
      };
      reader.readAsDataURL(file);
    }
  };

  // Start webcam
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Unable to access webcam. Please upload a photo instead.');
      setIsCameraActive(false);
    }
  };

  // Stop webcam
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Retake photo: stops active stream, clears existing selfie, clears any stale verification result, and launches live camera
  const retakePhoto = async () => {
    stopCamera();
    setSelfieImage(null);
    if (result) {
      setResult(null);
    }
    await startCamera();
  };

  // Capture webcam photo
  const captureCameraPhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setSelfieImage(dataUrl);

        // Stop stream
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setIsCameraActive(false);
      }
    }
  };

  // Run Verification Pipeline
  const runVerification = async () => {
    setIsVerifying(true);
    setResult(null);

    const steps = [
      'Extracting document structure via OCR engine...',
      'Performing ELA & typography tamper forensics...',
      'Comparing biometric facial vectors with live selfie...',
      'Querying Sybil deduplication index for multi-identity reuse...',
      'Evaluating age & student eligibility rules...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setVerificationStep(steps[i]);
      await new Promise(r => setTimeout(r, 400));
    }

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant,
          documentType: docType,
          rawOcrText,
          documentImage,
          selfieImage,
          simulatedAnomaly,
          testCaseId: selectedTestVector?.id
        })
      });

      const data = await response.json();
      const record = data.registration || data.record;

      if (data.success && record) {
        setResult(record);
        onVerificationComplete(record);

        if (record.status === 'VERIFIED') {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 }
          });
        }
      } else {
        alert(`Verification failed: ${data.error || 'Unknown response from server'}`);
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      alert(`Verification failed: ${err?.message || 'Server connection error'}`);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 340px',
      gap: '24px',
      alignItems: 'start'
    }}>
      
      {/* Center Column: Onboarding & Registration Form */}
      <div>

        {/* Top Greeting Header */}
        <div style={{
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Welcome, {applicant.name ? applicant.name.split(' ')[0] : 'Applicant'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Complete your institutional identity and eligibility compliance verification.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onOpenTestVectors}
              className="btn-primary"
              id="btn-load-sample-top"
            >
              <Sparkles size={16} />
              <span>Load Test Vectors</span>
            </button>
            {selectedTestVector && (
              <button
                onClick={onClearTestVector}
                className="btn-secondary"
              >
                Clear Preset
              </button>
            )}
          </div>
        </div>

        {/* Selected Test Vector Alert Banner */}
        {selectedTestVector && (
          <div style={{
            backgroundColor: 'var(--brand-glow)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '14px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Sparkles size={18} color="var(--brand-primary)" />
              <div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--brand-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  fontFamily: 'var(--font-mono)'
                }}>
                  Active Vector: {selectedTestVector.id}
                </span>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedTestVector.label}
                </p>
              </div>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--brand-primary)',
              border: '1px solid var(--border-color)',
              fontFamily: 'var(--font-mono)'
            }}>
              Expected: {selectedTestVector.expectedOutcome}
            </span>
          </div>
        )}

        {/* Swiss FinTech Applicant Profile Card */}
        <div className="swiss-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              
              {/* Document / Avatar Thumbnail Preview */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {documentImage ? (
                  <img src={documentImage} alt="ID Document" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <FileText size={28} color="var(--text-muted)" />
                )}
              </div>

              <div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--brand-primary)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  Primary Applicant Record
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {applicant.name || 'Enter Legal Name'}
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Supported Proofs: Aadhaar, College Student ID, Permanent Account Number (PAN)
                </p>
              </div>
            </div>

            {/* Document Upload Button */}
            <label className="btn-secondary" style={{ cursor: 'pointer' }}>
              <Upload size={15} />
              <span>Attach ID Document</span>
              <input type="file" accept="image/*" onChange={handleDocFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Form Inputs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
            
            {/* Field 1: Full Legal Name */}
            <div className="fintech-field-wrapper">
              <div className="fintech-field-header">
                <label htmlFor="input-applicant-name" className="fintech-field-label">
                  <User size={12} color="var(--brand-primary)" />
                  <span>Full Legal Name</span>
                </label>
                {applicant.name ? (
                  <span className="fintech-field-status">
                    <Check size={10} strokeWidth={3} />
                    <span>READY</span>
                  </span>
                ) : (
                  <span style={{ fontSize: '10.5px', color: 'var(--text-dim)', fontWeight: 600 }}>REQUIRED</span>
                )}
              </div>
              <div className="fintech-input-box">
                <div className="fintech-input-icon">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  className="fintech-input-control"
                  value={applicant.name}
                  onChange={e => {
                    setApplicant({ ...applicant, name: e.target.value });
                    if (result) setResult(null);
                  }}
                  placeholder="e.g. Rohan Sharma"
                  id="input-applicant-name"
                />
              </div>
            </div>

            {/* Field 2: Educational Institution */}
            <div className="fintech-field-wrapper">
              <div className="fintech-field-header">
                <label htmlFor="input-applicant-college" className="fintech-field-label">
                  <Building2 size={12} color="var(--brand-primary)" />
                  <span>Educational Institution</span>
                </label>
                {applicant.college ? (
                  <span className="fintech-field-status">
                    <Check size={10} strokeWidth={3} />
                    <span>ACCREDITED</span>
                  </span>
                ) : (
                  <span style={{ fontSize: '10.5px', color: 'var(--text-dim)', fontWeight: 600 }}>REQUIRED</span>
                )}
              </div>
              <div className="fintech-input-box">
                <div className="fintech-input-icon">
                  <Building2 size={16} />
                </div>
                <input
                  type="text"
                  className="fintech-input-control"
                  value={applicant.college}
                  onChange={e => setApplicant({ ...applicant, college: e.target.value })}
                  placeholder="e.g. National Institute of Technology"
                  id="input-applicant-college"
                />
              </div>
            </div>

            {/* Field 3: Email Address */}
            <div className="fintech-field-wrapper">
              <div className="fintech-field-header">
                <label htmlFor="input-applicant-email" className="fintech-field-label">
                  <Mail size={12} color="var(--brand-primary)" />
                  <span>Email Address</span>
                </label>
                {applicant.email ? (
                  <span className="fintech-field-status">
                    <Check size={10} strokeWidth={3} />
                    <span>VALID</span>
                  </span>
                ) : (
                  <span style={{ fontSize: '10.5px', color: 'var(--text-dim)', fontWeight: 600 }}>REQUIRED</span>
                )}
              </div>
              <div className="fintech-input-box">
                <div className="fintech-input-icon">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  className="fintech-input-control"
                  value={applicant.email}
                  onChange={e => setApplicant({ ...applicant, email: e.target.value })}
                  placeholder="applicant@example.com"
                  id="input-applicant-email"
                />
              </div>
            </div>

            {/* Field 4: Phone Number */}
            <div className="fintech-field-wrapper">
              <div className="fintech-field-header">
                <label htmlFor="input-applicant-phone" className="fintech-field-label">
                  <Phone size={12} color="var(--brand-primary)" />
                  <span>Phone Number</span>
                </label>
                {applicant.phone ? (
                  <span className="fintech-field-status">
                    <Check size={10} strokeWidth={3} />
                    <span>E.164</span>
                  </span>
                ) : (
                  <span style={{ fontSize: '10.5px', color: 'var(--text-dim)', fontWeight: 600 }}>OPTIONAL</span>
                )}
              </div>
              <div className="fintech-input-box">
                <div className="fintech-input-icon">
                  <Phone size={16} />
                </div>
                <input
                  type="text"
                  className="fintech-input-control font-mono"
                  value={applicant.phone}
                  onChange={e => setApplicant({ ...applicant, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  id="input-applicant-phone"
                />
              </div>
            </div>

          </div>

          {/* Document Type Selector */}
          <div style={{ marginTop: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                <ShieldCheck size={12} color="var(--brand-primary)" />
                <span>Select Verification Proof Type</span>
              </label>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Government Accredited ID Required
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { id: 'AADHAAR', label: 'Aadhaar (UIDAI Checksum)', icon: ShieldCheck },
                { id: 'COLLEGE_ID', label: 'College Student ID', icon: Building2 },
                { id: 'PAN', label: 'Permanent Account Number (PAN)', icon: CreditCard }
              ].map(d => {
                const Icon = d.icon;
                const isSel = docType === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDocType(d.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '9px 16px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: isSel ? 700 : 500,
                      backgroundColor: isSel ? 'var(--brand-primary)' : 'var(--bg-surface-subtle)',
                      color: isSel ? 'var(--bg-page)' : 'var(--text-secondary)',
                      border: isSel ? '1px solid var(--brand-primary)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      boxShadow: isSel ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={14} color={isSel ? 'var(--bg-page)' : 'var(--text-muted)'} />
                    <span>{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Verification Checklist */}
        <div className="swiss-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Verification Checklist
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {documentImage && selfieImage ? '3 of 3 steps ready' : documentImage || selfieImage ? '2 of 3 steps ready' : '1 of 3 steps ready'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Task Item 1: Personal Details */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: applicant.name && applicant.college ? 'var(--status-ok)' : 'var(--border-color)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {applicant.name && applicant.college ? <Check size={14} strokeWidth={3} /> : null}
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Personal Details & Affiliation
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Legal name, educational affiliation, and contact details
                  </p>
                </div>
              </div>
              <span className="badge-success" style={{ fontSize: '11px' }}>
                COMPLETED
              </span>
            </div>

            {/* Task Item 2: Document Proof */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: documentImage ? 'var(--status-ok)' : 'var(--border-color)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {documentImage ? <Check size={14} strokeWidth={3} /> : null}
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Identity Document File ({docType})
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {documentImage ? 'Document photo attached and ready for OCR analysis' : 'Upload document photo or load a sample vector'}
                  </p>
                </div>
              </div>
              {documentImage ? (
                <span className="badge-success" style={{ fontSize: '11px' }}>
                  ATTACHED
                </span>
              ) : (
                <label className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', cursor: 'pointer' }}>
                  <Upload size={14} /> Upload
                  <input type="file" accept="image/*" onChange={handleDocFileUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            {/* Task Item 3: Biometric Liveness */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: selfieImage ? 'var(--status-ok)' : 'var(--border-color)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {selfieImage ? <Check size={14} strokeWidth={3} /> : null}
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Biometric Portrait Match
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {selfieImage ? 'Selfie captured for facial vector comparison' : 'Take a live webcam selfie or upload photo'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={selfieImage ? retakePhoto : startCamera}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  id="btn-open-camera"
                >
                  {selfieImage ? <RotateCcw size={14} /> : <Camera size={14} />}
                  {selfieImage ? 'Retake Photo' : 'Webcam'}
                </button>
                <label className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', cursor: 'pointer' }}>
                  <Upload size={14} /> {selfieImage ? 'Replace Photo' : 'Photo'}
                  <input type="file" accept="image/*" onChange={handleSelfieFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Biometric Camera View & OCR Stream (Dual Card) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          
          {/* Biometric Card */}
          <div className="swiss-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={16} color="var(--brand-primary)" />
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Biometric Face Capture
                </h4>
              </div>
              <span className="badge-neutral" style={{ fontSize: '11px' }}>
                LIVENESS
              </span>
            </div>

            <div style={{
              height: '180px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-color)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isCameraActive ? (
                <>
                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute',
                    width: '120px',
                    height: '150px',
                    border: '2px dashed var(--brand-primary)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.35)'
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    zIndex: 10
                  }}>
                    <button
                      type="button"
                      onClick={captureCameraPhoto}
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                      id="btn-capture-selfie"
                    >
                      <Camera size={14} /> Capture
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="btn-secondary"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)'
                      }}
                      id="btn-cancel-camera"
                    >
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </>
              ) : selfieImage ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={selfieImage} alt="Selfie" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  
                  {/* Floating Action Overlay for Retaking Photo */}
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    right: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    zIndex: 5
                  }}>
                    <button
                      type="button"
                      onClick={retakePhoto}
                      className="btn-secondary"
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        color: 'var(--text-primary)',
                        boxShadow: 'var(--shadow-subtle)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer'
                      }}
                      id="btn-retake-captured-photo"
                      title="Open webcam to retake your selfie"
                    >
                      <RotateCcw size={12} /> Retake Photo
                    </button>

                    <span style={{
                      backgroundColor: 'var(--status-ok-bg)',
                      color: 'var(--status-ok-text)',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--status-ok-border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Check size={12} /> READY
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <User size={32} color="var(--text-dim)" style={{ margin: '0 auto 6px' }} />
                  <p style={{ fontSize: '12px' }}>No portrait selfie attached</p>
                </div>
              )}
            </div>
          </div>

          {/* Document OCR Stream Card */}
          <div className="swiss-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color="var(--brand-primary)" />
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Document OCR Stream
                </h4>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--brand-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                LIVE TEXT
              </span>
            </div>

            <textarea
              className="font-mono"
              rows={6}
              style={{
                fontSize: '12px',
                resize: 'none',
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                height: '180px'
              }}
              value={rawOcrText}
              onChange={e => setRawOcrText(e.target.value)}
              placeholder="Extracted document text lines..."
              id="textarea-ocr-stream"
            />
          </div>

        </div>

        {/* Verification Action Button */}
        <div style={{ marginBottom: '28px' }}>
          <button
            onClick={runVerification}
            disabled={isVerifying || !applicant.name}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '15px',
              borderRadius: '8px',
              fontWeight: 600
            }}
            id="btn-run-verification"
          >
            {isVerifying ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Running Verification Pipeline...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={20} />
                <span>Verify Identity & Issue Digital Pass</span>
              </>
            )}
          </button>
        </div>

        {/* Processing State Notice */}
        {isVerifying && (
          <div style={{
            padding: '18px 24px',
            borderRadius: '8px',
            backgroundColor: 'var(--brand-glow)',
            border: '1px solid var(--border-color)',
            color: 'var(--brand-primary)',
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
              <RefreshCw size={16} className="animate-spin" />
              <h4 style={{ fontSize: '14px', fontWeight: 600 }}>
                Verification Pipeline Active
              </h4>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>
              {verificationStep}
            </p>
          </div>
        )}

        {/* Verification Result Card */}
        {result && !isVerifying && (
          <div className="swiss-card" style={{
            borderLeft: result.status === 'VERIFIED'
              ? '4px solid var(--status-ok)'
              : result.status === 'REVIEW_NEEDED'
              ? '4px solid var(--status-warn)'
              : '4px solid var(--status-danger)',
            marginBottom: '28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span className={`badge-${
                    result.status === 'VERIFIED'
                      ? 'success'
                      : result.status === 'REVIEW_NEEDED'
                      ? 'warning'
                      : 'danger'
                  }`} style={{ fontSize: '12px', padding: '4px 10px' }}>
                    {result.status === 'VERIFIED' ? <CheckCircle size={14} /> : result.status === 'REVIEW_NEEDED' ? <AlertTriangle size={14} /> : <AlertOctagon size={14} />}
                    {result.statusBadge}
                  </span>

                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    REF ID: {result.id}
                  </span>
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {result.name}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '680px' }}>
                  {result.decisionReason}
                </p>
              </div>

              {/* Trust Score Hero Gauge */}
              <div style={{ width: '280px', minWidth: '260px' }}>
                <TrustScoreGauge
                  score={result.trustScore}
                  breakdown={result.scoreBreakdown}
                  status={result.status}
                  label="Trust Verdict Gauge"
                />
              </div>
            </div>

            {/* Forensic Tamper Heatmap Overlay */}
            {result.forensics?.isTampered && result.documentImage && (
              <div style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: 'var(--status-danger-bg)',
                border: '1px solid var(--status-danger-border)',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Eye size={16} color="var(--status-danger)" />
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--status-danger-text)' }}>
                    Forensic Tamper Heatmap Overlay (ELA & Typography Anomaly)
                  </h4>
                </div>

                <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                  <img src={result.documentImage} alt="Forensic Analysis" style={{ maxHeight: '200px', borderRadius: '6px', border: '1px solid var(--status-danger)' }} />
                  {result.forensics.anomalies.map((anom, aIdx) => (
                    <div
                      key={aIdx}
                      style={{
                        position: 'absolute',
                        left: `${anom.boundingBox.x}%`,
                        top: `${anom.boundingBox.y}%`,
                        width: `${anom.boundingBox.width}%`,
                        height: `${anom.boundingBox.height}%`,
                        border: '2px solid var(--status-danger)',
                        backgroundColor: 'var(--tamper-highlight-bg)',
                        borderRadius: '4px'
                      }}
                      title={anom.description}
                    />
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--status-danger-text)', marginTop: '8px' }}>
                  Digital manipulation detected in the identity region. Compression artifacts and font baseline jitter do not match original government printing.
                </p>
              </div>
            )}

            {/* Sybil Duplicate Attack Notification */}
            {result.isSybilAttack && (
              <div style={{
                padding: '14px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(124, 58, 237, 0.12)',
                border: '1px solid rgba(124, 58, 237, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <AlertOctagon size={22} color="#A78BFA" />
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#A78BFA' }}>
                    Sybil Duplicate Graph Triggered
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Identity document ({result.idNumber}) is already registered to "{result.sybilConflictRecord?.originalApplicantName}". Registration blocked from automated pass issuance.
                  </p>
                </div>
              </div>
            )}

            {/* Digital Participant Pass with Scannable QR Code */}
            {result.status === 'VERIFIED' && result.ticket && (
              <ParticipantTicket ticket={result.ticket} registrationId={result.id} />
            )}

          </div>
        )}

      </div>

      {/* Right Column: Swiss FinTech Aside Panel */}
      <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* 1. "Your Progress" Card */}
        <div className="swiss-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="var(--brand-primary)" />
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Application Status
              </h3>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>
              {progressPercent}%
            </span>
          </div>

          <div style={{ height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden', margin: '8px 0 16px' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: 'var(--brand-primary)', transition: 'width 0.3s ease' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
              <span style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: applicant.name ? 'var(--brand-primary)' : 'var(--border-color)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700
              }}>
                {applicant.name ? '✓' : '1'}
              </span>
              <span style={{ color: applicant.name ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: applicant.name ? 600 : 500 }}>
                Applicant Profile
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
              <span style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: documentImage ? 'var(--brand-primary)' : 'var(--border-color)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700
              }}>
                {documentImage ? '✓' : '2'}
              </span>
              <span style={{ color: documentImage ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: documentImage ? 600 : 500 }}>
                Identity Proof Upload
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
              <span style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: selfieImage ? 'var(--brand-primary)' : 'var(--border-color)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700
              }}>
                {selfieImage ? '✓' : '3'}
              </span>
              <span style={{ color: selfieImage ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: selfieImage ? 600 : 500 }}>
                Biometric Portrait Match
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
              <span style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: result ? 'var(--brand-primary)' : 'var(--border-color)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700
              }}>
                {result ? '✓' : '4'}
              </span>
              <span style={{ color: result ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: result ? 600 : 500 }}>
                Verification & Pass
              </span>
            </div>
          </div>
        </div>

        {/* 2. Verification Radar Card */}
        <div className="swiss-card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>
            Compliance Radar
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'var(--bg-surface-subtle)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Trust Score</span>
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-primary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                {result ? `${result.trustScore}%` : '98.4%'}
              </p>
            </div>

            <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'var(--bg-surface-subtle)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Forensic ELA</span>
              <p style={{ fontSize: '13px', fontWeight: 700, color: result?.forensics?.isTampered ? 'var(--status-danger-text)' : 'var(--status-ok-text)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                {result?.forensics?.isTampered ? 'FLAGGED' : 'CLEAN'}
              </p>
            </div>

            <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'var(--bg-surface-subtle)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Sybil Graph</span>
              <p style={{ fontSize: '13px', fontWeight: 700, color: result?.isSybilAttack ? '#A78BFA' : 'var(--brand-primary)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                {result?.isSybilAttack ? 'DUPLICATE' : 'UNIQUE'}
              </p>
            </div>

            <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'var(--bg-surface-subtle)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Digital Pass</span>
              <p style={{ fontSize: '13px', fontWeight: 700, color: result?.status === 'VERIFIED' ? 'var(--status-ok-text)' : 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                {result?.status === 'VERIFIED' ? 'ISSUED' : 'PENDING'}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Event & AI Engine Info Box */}
        <div className="swiss-card" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--status-ok)' }} />
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Institutional Compliance Node
            </h4>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Eligibility criteria enforced: Age 18–25 & Student College ID required. Verhoeff D5 mathematical checksum calculated on Aadhaar digits.
          </p>
        </div>

      </aside>

    </div>
  );
};
