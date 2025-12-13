import { useState, useCallback } from 'react';
import {
  CONFERENCE,
  VENUE,
  REGISTRATION_STEPS,
  REGISTRATION_STEP_LABELS,
  REGISTRATION_CATEGORIES,
  REGISTRATION_CATEGORY_LABELS,
  WORKSHOP_TRACKS,
  DIETARY_OPTIONS,
  ACCESSIBILITY_OPTIONS,
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
  getPaymentDeadline,
  formatDate,
  requiresProof,
} from '../utils';
import styles from './RegisterPage.module.css';

/**
 * Initial form data structure for registration
 */
const INITIAL_FORM_DATA = {
  // Personal Information
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  church: '',
  organization: '',

  // Ticket Selection
  category: REGISTRATION_CATEGORIES.REGULAR,
  proofDeclaration: false,

  // Workshop Preferences
  workshopTrack: WORKSHOP_TRACKS[0],

  // Special Requirements
  dietary: 'None',
  dietaryOther: '',
  accessibility: 'None',
  accessibilityOther: '',
  otherRequirements: '',

  // Terms
  termsAccepted: false,
};

/**
 * RegisterPage Component
 * Multi-step registration form for the IDMC Conference.
 * Handles attendee information collection, ticket selection,
 * workshop preferences, and displays payment instructions.
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
   * Validates the personal information step
   *
   * @returns {boolean} True if valid
   */
  const validatePersonalInfo = useCallback(() => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhoneNumber(formData.phone)) {
      newErrors.phone = 'Please enter a valid Philippine phone number';
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

    if (requiresProof(formData.category) && !formData.proofDeclaration) {
      newErrors.proofDeclaration =
        'Please confirm you can provide proof of status upon request';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /**
   * Validates the special requirements step
   *
   * @returns {boolean} True if valid
   */
  const validateSpecialRequirements = useCallback(() => {
    const newErrors = {};

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }

    if (formData.dietary === 'Other' && !formData.dietaryOther.trim()) {
      newErrors.dietaryOther = 'Please specify your dietary requirement';
    }

    if (formData.accessibility === 'Other' && !formData.accessibilityOther.trim()) {
      newErrors.accessibilityOther = 'Please specify your accessibility need';
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
      case REGISTRATION_STEPS.SPECIAL_REQUIREMENTS:
        isValid = validateSpecialRequirements();
        break;
      default:
        break;
    }

    if (isValid && currentStep < REGISTRATION_STEPS.CONFIRMATION) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  }, [currentStep, validatePersonalInfo, validateTicketSelection, validateSpecialRequirements]);

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
    const deadline = getPaymentDeadline(PAYMENT_INFO.PAYMENT_DEADLINE_DAYS);

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
                    {formData.firstName} {formData.lastName}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Email</span>
                  <span className={styles.summaryValue}>{formData.email}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Phone</span>
                  <span className={styles.summaryValue}>{formData.phone}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Category</span>
                  <span className={styles.summaryValue}>
                    {REGISTRATION_CATEGORY_LABELS[formData.category]}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Pricing Tier</span>
                  <span className={styles.summaryValue}>{currentTier.name}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Workshop Track</span>
                  <span className={styles.summaryValue}>{formData.workshopTrack}</span>
                </div>
              </div>

              <div className={styles.amountDue}>
                <span>Amount Due</span>
                <span className={styles.amountValue}>{formatPrice(amount)}</span>
              </div>
            </div>

            <div className={styles.paymentInstructions}>
              <h2>Payment Instructions</h2>
              <p className={styles.paymentDeadline}>
                Please complete payment by <strong>{formatDate(deadline)}</strong>
              </p>

              <div className={styles.paymentMethods}>
                <div className={styles.paymentMethod}>
                  <h3>GCash</h3>
                  <p>
                    <strong>Account Name:</strong> {PAYMENT_INFO.GCASH.NAME}
                  </p>
                  <p>
                    <strong>Number:</strong> {PAYMENT_INFO.GCASH.NUMBER}
                  </p>
                </div>

                <div className={styles.paymentMethod}>
                  <h3>Bank Transfer</h3>
                  <p>
                    <strong>Account Name:</strong> {PAYMENT_INFO.BANK.NAME}
                  </p>
                  <p>
                    <strong>Bank:</strong> {PAYMENT_INFO.BANK.BANK_NAME}
                  </p>
                  <p>
                    <strong>Account No:</strong> {PAYMENT_INFO.BANK.ACCOUNT_NUMBER}
                  </p>
                  <p>
                    <strong>Branch:</strong> {PAYMENT_INFO.BANK.BRANCH}
                  </p>
                </div>
              </div>

              <div className={styles.paymentNote}>
                <p>
                  <strong>Important:</strong> Please include your registration ID (
                  <strong>{registrationId}</strong>) as the payment reference/note.
                </p>
                <p>
                  A confirmation email will be sent to <strong>{formData.email}</strong>{' '}
                  once your payment has been verified.
                </p>
              </div>
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
                Please provide your contact details for registration.
              </p>

              <div className={styles.formRow}>
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
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && (
                    <span className={styles.errorMessage}>{errors.firstName}</span>
                  )}
                </div>

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
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && (
                    <span className={styles.errorMessage}>{errors.lastName}</span>
                  )}
                </div>
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

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>
                  Phone Number <span className={styles.required}>*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="09XX-XXX-XXXX"
                />
                {errors.phone && (
                  <span className={styles.errorMessage}>{errors.phone}</span>
                )}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="church" className={styles.label}>
                    Church
                  </label>
                  <input
                    id="church"
                    type="text"
                    className={styles.input}
                    value={formData.church}
                    onChange={(e) => updateField('church', e.target.value)}
                    placeholder="Your church name"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="organization" className={styles.label}>
                    Organization
                  </label>
                  <input
                    id="organization"
                    type="text"
                    className={styles.input}
                    value={formData.organization}
                    onChange={(e) => updateField('organization', e.target.value)}
                    placeholder="Your organization (if applicable)"
                  />
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
                      <div className={styles.categoryInfo}>
                        <h3>{REGISTRATION_CATEGORY_LABELS[value]}</h3>
                        <span className={styles.categoryPrice}>{formatPrice(price)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {requiresProof(formData.category) && (
                <div className={styles.proofSection}>
                  <div className={styles.proofNote}>
                    <strong>Note:</strong> {REGISTRATION_CATEGORY_LABELS[formData.category]}{' '}
                    registration requires proof of status. You may be asked to provide a
                    valid ID or certificate upon check-in.
                  </div>

                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.proofDeclaration}
                        onChange={(e) => updateField('proofDeclaration', e.target.checked)}
                        className={styles.checkbox}
                      />
                      <span>
                        I understand and confirm that I can provide proof of my{' '}
                        {formData.category === REGISTRATION_CATEGORIES.STUDENT
                          ? 'student'
                          : 'NSF'}{' '}
                        status upon request.
                      </span>
                    </label>
                    {errors.proofDeclaration && (
                      <span className={styles.errorMessage}>{errors.proofDeclaration}</span>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.pricingInfo}>
                <h3>Pricing Tiers</h3>
                <div className={styles.tierList}>
                  {/* Show all pricing tiers for reference - using index as key for static list */}
                  {[
                    { name: 'Super Early Bird', regularPrice: 170, studentPrice: 120, id: 'super-early-bird' },
                    { name: 'Early Bird', regularPrice: 210, studentPrice: 150, id: 'early-bird' },
                    { name: 'Regular', regularPrice: 290, studentPrice: 200, id: 'regular' },
                  ].map((tier) => (
                    <div
                      key={tier.id}
                      className={`${styles.tierItem} ${
                        tier.name === currentTier.name ? styles.tierItemActive : ''
                      }`}
                    >
                      <span className={styles.tierName}>
                        {tier.name}
                        {tier.name === currentTier.name && (
                          <span className={styles.currentBadge}>Current</span>
                        )}
                      </span>
                      <span className={styles.tierPrices}>
                        Regular: {formatPrice(tier.regularPrice)} | Student/NSF:{' '}
                        {formatPrice(tier.studentPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Workshop Preferences */}
          {currentStep === REGISTRATION_STEPS.WORKSHOP_PREFERENCES && (
            <div className={styles.formStep}>
              <h2>Workshop Preferences</h2>
              <p className={styles.stepDescription}>
                Select your preferred workshop track. All tracks address the theme:
                &quot;Overcoming Discipleship Pitfalls in Every Generation&quot;
              </p>

              <div className={styles.workshopCards}>
                {WORKSHOP_TRACKS.map((track) => {
                  const isSelected = formData.workshopTrack === track;

                  return (
                    <div
                      key={track}
                      className={`${styles.workshopCard} ${
                        isSelected ? styles.workshopCardSelected : ''
                      }`}
                      onClick={() => updateField('workshopTrack', track)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          updateField('workshopTrack', track);
                        }
                      }}
                    >
                      <div className={styles.workshopRadio}>
                        <input
                          type="radio"
                          name="workshopTrack"
                          value={track}
                          checked={isSelected}
                          onChange={() => updateField('workshopTrack', track)}
                          id={`workshop-${track}`}
                        />
                      </div>
                      <div className={styles.workshopInfo}>
                        <h3>{track}</h3>
                        <p>Overcoming Pitfalls in the Discipleship of {track}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Special Requirements */}
          {currentStep === REGISTRATION_STEPS.SPECIAL_REQUIREMENTS && (
            <div className={styles.formStep}>
              <h2>Special Requirements</h2>
              <p className={styles.stepDescription}>
                Let us know if you have any dietary or accessibility requirements.
              </p>

              <div className={styles.formGroup}>
                <label htmlFor="dietary" className={styles.label}>
                  Dietary Requirements
                </label>
                <select
                  id="dietary"
                  className={styles.select}
                  value={formData.dietary}
                  onChange={(e) => updateField('dietary', e.target.value)}
                >
                  {DIETARY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {formData.dietary === 'Other' && (
                <div className={styles.formGroup}>
                  <label htmlFor="dietaryOther" className={styles.label}>
                    Please specify <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="dietaryOther"
                    type="text"
                    className={`${styles.input} ${errors.dietaryOther ? styles.inputError : ''}`}
                    value={formData.dietaryOther}
                    onChange={(e) => updateField('dietaryOther', e.target.value)}
                    placeholder="Specify your dietary requirement"
                  />
                  {errors.dietaryOther && (
                    <span className={styles.errorMessage}>{errors.dietaryOther}</span>
                  )}
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="accessibility" className={styles.label}>
                  Accessibility Needs
                </label>
                <select
                  id="accessibility"
                  className={styles.select}
                  value={formData.accessibility}
                  onChange={(e) => updateField('accessibility', e.target.value)}
                >
                  {ACCESSIBILITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {formData.accessibility === 'Other' && (
                <div className={styles.formGroup}>
                  <label htmlFor="accessibilityOther" className={styles.label}>
                    Please specify <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="accessibilityOther"
                    type="text"
                    className={`${styles.input} ${errors.accessibilityOther ? styles.inputError : ''}`}
                    value={formData.accessibilityOther}
                    onChange={(e) => updateField('accessibilityOther', e.target.value)}
                    placeholder="Specify your accessibility need"
                  />
                  {errors.accessibilityOther && (
                    <span className={styles.errorMessage}>{errors.accessibilityOther}</span>
                  )}
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="otherRequirements" className={styles.label}>
                  Other Requirements
                </label>
                <textarea
                  id="otherRequirements"
                  className={styles.textarea}
                  value={formData.otherRequirements}
                  onChange={(e) => updateField('otherRequirements', e.target.value)}
                  placeholder="Any other special requirements or notes"
                  rows={3}
                />
              </div>

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

          {/* Step 5: Confirmation */}
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
                      {formData.firstName} {formData.lastName}
                    </span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Email</span>
                    <span className={styles.reviewValue}>{formData.email}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Phone</span>
                    <span className={styles.reviewValue}>{formData.phone}</span>
                  </div>
                  {formData.church && (
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Church</span>
                      <span className={styles.reviewValue}>{formData.church}</span>
                    </div>
                  )}
                  {formData.organization && (
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Organization</span>
                      <span className={styles.reviewValue}>{formData.organization}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.reviewSection}>
                <h3>Ticket Details</h3>
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
                    <span className={styles.reviewLabel}>Workshop Track</span>
                    <span className={styles.reviewValue}>{formData.workshopTrack}</span>
                  </div>
                </div>
              </div>

              {(formData.dietary !== 'None' ||
                formData.accessibility !== 'None' ||
                formData.otherRequirements) && (
                <div className={styles.reviewSection}>
                  <h3>Special Requirements</h3>
                  <div className={styles.reviewGrid}>
                    {formData.dietary !== 'None' && (
                      <div className={styles.reviewItem}>
                        <span className={styles.reviewLabel}>Dietary</span>
                        <span className={styles.reviewValue}>
                          {formData.dietary === 'Other'
                            ? formData.dietaryOther
                            : formData.dietary}
                        </span>
                      </div>
                    )}
                    {formData.accessibility !== 'None' && (
                      <div className={styles.reviewItem}>
                        <span className={styles.reviewLabel}>Accessibility</span>
                        <span className={styles.reviewValue}>
                          {formData.accessibility === 'Other'
                            ? formData.accessibilityOther
                            : formData.accessibility}
                        </span>
                      </div>
                    )}
                    {formData.otherRequirements && (
                      <div className={styles.reviewItem}>
                        <span className={styles.reviewLabel}>Other</span>
                        <span className={styles.reviewValue}>
                          {formData.otherRequirements}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.totalSection}>
                <span>Total Amount Due</span>
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
