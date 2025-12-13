import { useState, useCallback } from 'react';
import {
  CONFERENCE,
  VENUE,
  REGISTRATION_STEPS,
  REGISTRATION_STEP_LABELS,
  REGISTRATION_CATEGORIES,
  REGISTRATION_CATEGORY_LABELS,
  REGISTRATION_CATEGORY_DESCRIPTIONS,
  MINISTRY_ROLES,
  PAYMENT_INFO,
} from '../constants';
import {
  getCurrentPricingTier,
  calculatePrice,
  generateRegistrationId,
  isRegistrationOpen,
  formatPrice,
  isValidEmail,
  isValidPhoneNumber,
  requiresProof,
} from '../utils';
import styles from './RegisterPage.module.css';

/**
 * Initial form data structure for registration
 */
const INITIAL_FORM_DATA = {
  // Personal Information
  lastName: '',
  firstName: '',
  middleName: '',
  cellphone: '',
  email: '',

  // Church Information
  churchName: '',
  ministryRole: '',
  churchCity: '',
  churchProvince: '',

  // Ticket Selection
  category: REGISTRATION_CATEGORIES.REGULAR,

  // Payment
  paymentFile: null,
  paymentFileName: '',

  // Invoice Request
  invoiceRequest: false,
  invoiceName: '',
  tin: '',
  invoiceAddress: '',

  // Terms
  termsAccepted: false,
};

/**
 * RegisterPage Component
 * Multi-step registration form for the IDMC Conference.
 * Handles attendee information collection, ticket selection,
 * payment upload, and invoice request.
 *
 * @returns {JSX.Element} The registration page component
 */
function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(REGISTRATION_STEPS.PERSONAL_INFO);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [registrationId, setRegistrationId] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentTier = getCurrentPricingTier();
  const registrationOpen = isRegistrationOpen();

  /**
   * Updates a form field value
   *
   * @param {string} field - The field name to update
   * @param {*} value - The new value
   */
  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  }, []);

  /**
   * Handles file selection for payment upload
   *
   * @param {Event} e - The file input change event
   */
  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          paymentFile: 'Please upload an image (JPG, PNG, GIF) or PDF file',
        }));
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          paymentFile: 'File size must be less than 5MB',
        }));
        return;
      }
      setFormData((prev) => ({
        ...prev,
        paymentFile: file,
        paymentFileName: file.name,
      }));
      setErrors((prev) => ({ ...prev, paymentFile: null }));
    }
  }, []);

  /**
   * Validates the personal information step
   *
   * @returns {boolean} True if valid
   */
  const validatePersonalInfo = useCallback(() => {
    const newErrors = {};

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.cellphone.trim()) {
      newErrors.cellphone = 'Cellphone number is required';
    } else if (!isValidPhoneNumber(formData.cellphone)) {
      newErrors.cellphone = 'Please enter a valid Philippine cellphone number';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.churchName.trim()) {
      newErrors.churchName = 'Church name is required';
    }
    if (!formData.ministryRole) {
      newErrors.ministryRole = 'Ministry role is required';
    }
    if (!formData.churchCity.trim()) {
      newErrors.churchCity = 'City is required';
    }
    if (!formData.churchProvince.trim()) {
      newErrors.churchProvince = 'Province/Region is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /**
   * Validates the ticket selection step
   *
   * @returns {boolean} True if valid
   */
  const validateTicketSelection = useCallback(() => {
    const newErrors = {};

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /**
   * Validates the payment upload step
   *
   * @returns {boolean} True if valid
   */
  const validatePaymentUpload = useCallback(() => {
    const newErrors = {};

    if (!formData.paymentFile) {
      newErrors.paymentFile = 'Please upload your payment screenshot or receipt';
    }

    if (formData.invoiceRequest) {
      if (!formData.invoiceName.trim()) {
        newErrors.invoiceName = 'Name for invoice is required';
      }
      if (!formData.tin.trim()) {
        newErrors.tin = 'TIN is required for invoice';
      }
      if (!formData.invoiceAddress.trim()) {
        newErrors.invoiceAddress = 'Address is required for invoice';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /**
   * Handles moving to the next step
   */
  const handleNext = useCallback(() => {
    let isValid = true;

    switch (currentStep) {
      case REGISTRATION_STEPS.PERSONAL_INFO:
        isValid = validatePersonalInfo();
        break;
      case REGISTRATION_STEPS.TICKET_SELECTION:
        isValid = validateTicketSelection();
        break;
      case REGISTRATION_STEPS.PAYMENT_UPLOAD:
        isValid = validatePaymentUpload();
        break;
      default:
        break;
    }

    if (isValid && currentStep < REGISTRATION_STEPS.CONFIRMATION) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  }, [currentStep, validatePersonalInfo, validateTicketSelection, validatePaymentUpload]);

  /**
   * Handles moving to the previous step
   */
  const handleBack = useCallback(() => {
    if (currentStep > REGISTRATION_STEPS.PERSONAL_INFO) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo(0, 0);
    }
  }, [currentStep]);

  /**
   * Handles form submission
   */
  const handleSubmit = useCallback(() => {
    const newRegistrationId = generateRegistrationId();
    setRegistrationId(newRegistrationId);
    setIsSubmitted(true);
    window.scrollTo(0, 0);
  }, []);

  // Registration closed state
  if (!registrationOpen) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.closedMessage}>
            <h1>Registration Closed</h1>
            <p>
              Registration for IDMC {CONFERENCE.YEAR} has ended. Thank you for your
              interest!
            </p>
            <p>
              If you have any questions, please contact us at{' '}
              <a href="mailto:email@gcfsouthmetro.org">email@gcfsouthmetro.org</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Submitted/Confirmation state
  if (isSubmitted) {
    const amount = calculatePrice(formData.category, currentTier);

    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.confirmationCard}>
            <div className={styles.confirmationHeader}>
              <div className={styles.checkIcon}>✓</div>
              <h1>Registration Submitted!</h1>
              <p className={styles.registrationIdDisplay}>
                Registration ID: <strong>{registrationId}</strong>
              </p>
            </div>

            <div className={styles.confirmationDetails}>
              <h2>Registration Summary</h2>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Name</span>
                  <span className={styles.summaryValue}>
                    {formData.lastName}, {formData.firstName} {formData.middleName}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Email</span>
                  <span className={styles.summaryValue}>{formData.email}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Cellphone</span>
                  <span className={styles.summaryValue}>{formData.cellphone}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Church</span>
                  <span className={styles.summaryValue}>{formData.churchName}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Ministry Role</span>
                  <span className={styles.summaryValue}>{formData.ministryRole}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Location</span>
                  <span className={styles.summaryValue}>
                    {formData.churchCity}, {formData.churchProvince}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Category</span>
                  <span className={styles.summaryValue}>
                    {REGISTRATION_CATEGORY_LABELS[formData.category]}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Payment Uploaded</span>
                  <span className={styles.summaryValue}>{formData.paymentFileName}</span>
                </div>
                {formData.invoiceRequest && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Invoice Requested</span>
                    <span className={styles.summaryValue}>Yes - {formData.invoiceName}</span>
                  </div>
                )}
              </div>

              <div className={styles.amountDue}>
                <span>Amount Paid</span>
                <span className={styles.amountValue}>{formatPrice(amount)}</span>
              </div>
            </div>

            <div className={styles.nextSteps}>
              <h2>What&apos;s Next?</h2>
              <ol>
                <li>Your payment will be verified within 24-48 hours.</li>
                <li>A confirmation email will be sent to <strong>{formData.email}</strong>.</li>
                <li>Please save your Registration ID: <strong>{registrationId}</strong></li>
                <li>Present your confirmation email or Registration ID at the event.</li>
              </ol>
            </div>

            <div className={styles.eventDetails}>
              <h2>Event Details</h2>
              <p>
                <strong>Date:</strong> March 28, {CONFERENCE.YEAR}
              </p>
              <p>
                <strong>Venue:</strong> {VENUE.NAME}
              </p>
              <p>
                <strong>Address:</strong> {VENUE.ADDRESS}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main form state
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.formHeader}>
          <h1>Register for IDMC {CONFERENCE.YEAR}</h1>
          <p className={styles.conferenceInfo}>
            {CONFERENCE.THEME} | March 28, {CONFERENCE.YEAR}
          </p>
        </div>

        {/* Progress Steps */}
        <div className={styles.progressBar}>
          {Object.entries(REGISTRATION_STEP_LABELS).map(([step, label]) => {
            const stepNum = parseInt(step, 10);
            return (
              <div
                key={step}
                className={`${styles.progressStep} ${
                  stepNum === currentStep ? styles.progressStepActive : ''
                } ${stepNum < currentStep ? styles.progressStepCompleted : ''}`}
              >
                <div className={styles.progressStepNumber}>{stepNum}</div>
                <span className={styles.progressStepLabel}>{label}</span>
              </div>
            );
          })}
        </div>

        <div className={styles.formCard}>
          {/* Step 1: Personal Information */}
          {currentStep === REGISTRATION_STEPS.PERSONAL_INFO && (
            <div className={styles.formStep}>
              <h2>Personal Information</h2>
              <p className={styles.stepDescription}>
                Please provide your contact and church details for registration.
              </p>

              <div className={styles.formRow3}>
                <div className={styles.formGroup}>
                  <label htmlFor="lastName" className={styles.label}>
                    Last Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="Dela Cruz"
                  />
                  {errors.lastName && (
                    <span className={styles.errorMessage}>{errors.lastName}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="firstName" className={styles.label}>
                    First Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="Juan"
                  />
                  {errors.firstName && (
                    <span className={styles.errorMessage}>{errors.firstName}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="middleName" className={styles.label}>
                    Middle Name
                  </label>
                  <input
                    id="middleName"
                    type="text"
                    className={styles.input}
                    value={formData.middleName}
                    onChange={(e) => updateField('middleName', e.target.value)}
                    placeholder="Santos"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="cellphone" className={styles.label}>
                    Cellphone Number <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="cellphone"
                    type="tel"
                    className={`${styles.input} ${errors.cellphone ? styles.inputError : ''}`}
                    value={formData.cellphone}
                    onChange={(e) => updateField('cellphone', e.target.value)}
                    placeholder="09XX-XXX-XXXX"
                  />
                  {errors.cellphone && (
                    <span className={styles.errorMessage}>{errors.cellphone}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Email Address <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="your.email@example.com"
                  />
                  {errors.email && (
                    <span className={styles.errorMessage}>{errors.email}</span>
                  )}
                </div>
              </div>

              <div className={styles.sectionDivider}>
                <span>Church Information</span>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="churchName" className={styles.label}>
                    Church Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="churchName"
                    type="text"
                    className={`${styles.input} ${errors.churchName ? styles.inputError : ''}`}
                    value={formData.churchName}
                    onChange={(e) => updateField('churchName', e.target.value)}
                    placeholder="GCF South Metro"
                  />
                  {errors.churchName && (
                    <span className={styles.errorMessage}>{errors.churchName}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="ministryRole" className={styles.label}>
                    Ministry Role <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="ministryRole"
                    className={`${styles.select} ${errors.ministryRole ? styles.inputError : ''}`}
                    value={formData.ministryRole}
                    onChange={(e) => updateField('ministryRole', e.target.value)}
                  >
                    <option value="">Select your role</option>
                    {MINISTRY_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  {errors.ministryRole && (
                    <span className={styles.errorMessage}>{errors.ministryRole}</span>
                  )}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="churchCity" className={styles.label}>
                    City <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="churchCity"
                    type="text"
                    className={`${styles.input} ${errors.churchCity ? styles.inputError : ''}`}
                    value={formData.churchCity}
                    onChange={(e) => updateField('churchCity', e.target.value)}
                    placeholder="Las Piñas City"
                  />
                  {errors.churchCity && (
                    <span className={styles.errorMessage}>{errors.churchCity}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="churchProvince" className={styles.label}>
                    Province / Region <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="churchProvince"
                    type="text"
                    className={`${styles.input} ${errors.churchProvince ? styles.inputError : ''}`}
                    value={formData.churchProvince}
                    onChange={(e) => updateField('churchProvince', e.target.value)}
                    placeholder="Metro Manila / NCR"
                  />
                  {errors.churchProvince && (
                    <span className={styles.errorMessage}>{errors.churchProvince}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Ticket Selection */}
          {currentStep === REGISTRATION_STEPS.TICKET_SELECTION && (
            <div className={styles.formStep}>
              <h2>Ticket Selection</h2>
              <p className={styles.stepDescription}>
                Select your registration category. Current pricing tier:{' '}
                <strong>{currentTier.name}</strong>
              </p>

              <div className={styles.categoryCards}>
                {Object.entries(REGISTRATION_CATEGORIES).map(([key, value]) => {
                  const price = calculatePrice(value, currentTier);
                  const isSelected = formData.category === value;

                  return (
                    <div
                      key={key}
                      className={`${styles.categoryCard} ${
                        isSelected ? styles.categoryCardSelected : ''
                      }`}
                      onClick={() => updateField('category', value)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          updateField('category', value);
                        }
                      }}
                    >
                      <div className={styles.categoryRadio}>
                        <input
                          type="radio"
                          name="category"
                          value={value}
                          checked={isSelected}
                          onChange={() => updateField('category', value)}
                          id={`category-${value}`}
                        />
                      </div>
                      <div className={styles.categoryContent}>
                        <div className={styles.categoryInfo}>
                          <h3>{REGISTRATION_CATEGORY_LABELS[value]}</h3>
                          <p className={styles.categoryDescription}>
                            {REGISTRATION_CATEGORY_DESCRIPTIONS[value]}
                          </p>
                        </div>
                        <span className={styles.categoryPrice}>{formatPrice(price)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {requiresProof(formData.category) && (
                <div className={styles.proofNote}>
                  <strong>Note:</strong> Student/Senior Citizen registration requires a valid ID.
                  Please bring your Student ID or Senior Citizen ID for verification at check-in.
                </div>
              )}

              <div className={styles.termsSection}>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.termsAccepted}
                      onChange={(e) => updateField('termsAccepted', e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span>
                      I agree to the{' '}
                      <a href="/terms" target="_blank" rel="noopener noreferrer">
                        Terms and Conditions
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer">
                        Privacy Policy
                      </a>
                      . <span className={styles.required}>*</span>
                    </span>
                  </label>
                  {errors.termsAccepted && (
                    <span className={styles.errorMessage}>{errors.termsAccepted}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment Upload */}
          {currentStep === REGISTRATION_STEPS.PAYMENT_UPLOAD && (
            <div className={styles.formStep}>
              <h2>Payment Upload</h2>
              <p className={styles.stepDescription}>
                Please make your payment and upload the screenshot or receipt.
              </p>

              <div className={styles.paymentInstructions}>
                <h3>Payment Options</h3>
                <div className={styles.paymentMethods}>
                  <div className={styles.paymentMethod}>
                    <h4>GCash</h4>
                    <p>
                      <strong>Account Name:</strong> {PAYMENT_INFO.GCASH.NAME}
                    </p>
                    <p>
                      <strong>Number:</strong> {PAYMENT_INFO.GCASH.NUMBER}
                    </p>
                  </div>

                  <div className={styles.paymentMethod}>
                    <h4>Bank Transfer</h4>
                    <p>
                      <strong>Account Name:</strong> {PAYMENT_INFO.BANK.NAME}
                    </p>
                    <p>
                      <strong>Bank:</strong> {PAYMENT_INFO.BANK.BANK_NAME}
                    </p>
                    <p>
                      <strong>Account No:</strong> {PAYMENT_INFO.BANK.ACCOUNT_NUMBER}
                    </p>
                  </div>
                </div>

                <div className={styles.amountBox}>
                  <span>Amount to Pay:</span>
                  <strong>{formatPrice(calculatePrice(formData.category, currentTier))}</strong>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="paymentFile" className={styles.label}>
                  Upload Payment Screenshot/Receipt <span className={styles.required}>*</span>
                </label>
                <div className={styles.fileUpload}>
                  <input
                    id="paymentFile"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                  />
                  <div className={styles.fileUploadButton}>
                    {formData.paymentFileName ? (
                      <span className={styles.fileName}>{formData.paymentFileName}</span>
                    ) : (
                      <span>Click to select file (JPG, PNG, GIF, or PDF)</span>
                    )}
                  </div>
                </div>
                {errors.paymentFile && (
                  <span className={styles.errorMessage}>{errors.paymentFile}</span>
                )}
                <p className={styles.fileHint}>Maximum file size: 5MB</p>
              </div>

              <div className={styles.sectionDivider}>
                <span>Invoice Request (Optional)</span>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.invoiceRequest}
                      onChange={(e) => updateField('invoiceRequest', e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span>I need an official invoice/receipt</span>
                  </label>
                </div>
              </div>

              {formData.invoiceRequest && (
                <div className={styles.invoiceFields}>
                  <div className={styles.formGroup}>
                    <label htmlFor="invoiceName" className={styles.label}>
                      Name in Invoice <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="invoiceName"
                      type="text"
                      className={`${styles.input} ${errors.invoiceName ? styles.inputError : ''}`}
                      value={formData.invoiceName}
                      onChange={(e) => updateField('invoiceName', e.target.value)}
                      placeholder="Full name or company name"
                    />
                    {errors.invoiceName && (
                      <span className={styles.errorMessage}>{errors.invoiceName}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="tin" className={styles.label}>
                      TIN (Tax Identification Number) <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="tin"
                      type="text"
                      className={`${styles.input} ${errors.tin ? styles.inputError : ''}`}
                      value={formData.tin}
                      onChange={(e) => updateField('tin', e.target.value)}
                      placeholder="XXX-XXX-XXX-XXX"
                    />
                    {errors.tin && (
                      <span className={styles.errorMessage}>{errors.tin}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="invoiceAddress" className={styles.label}>
                      Address <span className={styles.required}>*</span>
                    </label>
                    <textarea
                      id="invoiceAddress"
                      className={`${styles.textarea} ${errors.invoiceAddress ? styles.inputError : ''}`}
                      value={formData.invoiceAddress}
                      onChange={(e) => updateField('invoiceAddress', e.target.value)}
                      placeholder="Complete billing address"
                      rows={3}
                    />
                    {errors.invoiceAddress && (
                      <span className={styles.errorMessage}>{errors.invoiceAddress}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === REGISTRATION_STEPS.CONFIRMATION && (
            <div className={styles.formStep}>
              <h2>Review Your Registration</h2>
              <p className={styles.stepDescription}>
                Please review your information before submitting.
              </p>

              <div className={styles.reviewSection}>
                <h3>Personal Information</h3>
                <div className={styles.reviewGrid}>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Name</span>
                    <span className={styles.reviewValue}>
                      {formData.lastName}, {formData.firstName} {formData.middleName}
                    </span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Cellphone</span>
                    <span className={styles.reviewValue}>{formData.cellphone}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Email</span>
                    <span className={styles.reviewValue}>{formData.email}</span>
                  </div>
                </div>
              </div>

              <div className={styles.reviewSection}>
                <h3>Church Information</h3>
                <div className={styles.reviewGrid}>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Church</span>
                    <span className={styles.reviewValue}>{formData.churchName}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Ministry Role</span>
                    <span className={styles.reviewValue}>{formData.ministryRole}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Location</span>
                    <span className={styles.reviewValue}>
                      {formData.churchCity}, {formData.churchProvince}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.reviewSection}>
                <h3>Registration Details</h3>
                <div className={styles.reviewGrid}>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Category</span>
                    <span className={styles.reviewValue}>
                      {REGISTRATION_CATEGORY_LABELS[formData.category]}
                    </span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Pricing Tier</span>
                    <span className={styles.reviewValue}>{currentTier.name}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Payment Uploaded</span>
                    <span className={styles.reviewValue}>{formData.paymentFileName}</span>
                  </div>
                </div>
              </div>

              {formData.invoiceRequest && (
                <div className={styles.reviewSection}>
                  <h3>Invoice Details</h3>
                  <div className={styles.reviewGrid}>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Name</span>
                      <span className={styles.reviewValue}>{formData.invoiceName}</span>
                    </div>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>TIN</span>
                      <span className={styles.reviewValue}>{formData.tin}</span>
                    </div>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Address</span>
                      <span className={styles.reviewValue}>{formData.invoiceAddress}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.totalSection}>
                <span>Total Amount</span>
                <span className={styles.totalAmount}>
                  {formatPrice(calculatePrice(formData.category, currentTier))}
                </span>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className={styles.formNavigation}>
            {currentStep > REGISTRATION_STEPS.PERSONAL_INFO && (
              <button
                type="button"
                className={styles.buttonSecondary}
                onClick={handleBack}
              >
                Back
              </button>
            )}

            {currentStep < REGISTRATION_STEPS.CONFIRMATION ? (
              <button
                type="button"
                className={styles.buttonPrimary}
                onClick={handleNext}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                className={styles.buttonPrimary}
                onClick={handleSubmit}
              >
                Submit Registration
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
