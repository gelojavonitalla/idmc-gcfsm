import { useState, useCallback } from 'react';
import {
  CONFERENCE,
  VENUE,
  REGISTRATION_STEPS,
  REGISTRATION_STEP_LABELS,
  REGISTRATION_CATEGORIES,
  REGISTRATION_CATEGORY_LABELS,
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
 * Creates a new empty attendee object
 *
 * @returns {Object} Empty attendee data
 */
const createEmptyAttendee = () => ({
  id: Date.now() + Math.random(),
  lastName: '',
  firstName: '',
  middleName: '',
  cellphone: '',
  email: '',
  ministryRole: '',
  category: REGISTRATION_CATEGORIES.REGULAR,
});

/**
 * Initial form data structure for registration
 */
const INITIAL_FORM_DATA = {
  // Church Information (shared)
  churchName: '',
  churchCity: '',
  churchProvince: '',

  // Attendees list
  attendees: [createEmptyAttendee()],

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
 * Supports multiple attendees with shared church information.
 *
 * @returns {JSX.Element} The registration page component
 */
function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(REGISTRATION_STEPS.PERSONAL_INFO);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [attendeeErrors, setAttendeeErrors] = useState({});
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
   * Updates an attendee field value
   *
   * @param {number} index - The attendee index
   * @param {string} field - The field name to update
   * @param {*} value - The new value
   */
  const updateAttendee = useCallback((index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      attendees: prev.attendees.map((attendee, i) =>
        i === index ? { ...attendee, [field]: value } : attendee
      ),
    }));
    setAttendeeErrors((prev) => ({
      ...prev,
      [index]: { ...prev[index], [field]: null },
    }));
  }, []);

  /**
   * Adds a new attendee
   */
  const addAttendee = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      attendees: [...prev.attendees, createEmptyAttendee()],
    }));
  }, []);

  /**
   * Removes an attendee
   *
   * @param {number} index - The attendee index to remove
   */
  const removeAttendee = useCallback((index) => {
    if (formData.attendees.length > 1) {
      setFormData((prev) => ({
        ...prev,
        attendees: prev.attendees.filter((_, i) => i !== index),
      }));
      setAttendeeErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  }, [formData.attendees.length]);

  /**
   * Handles file selection for payment upload
   *
   * @param {Event} e - The file input change event
   */
  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          paymentFile: 'Please upload an image (JPG, PNG, GIF) or PDF file',
        }));
        return;
      }
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
   * Calculates total price for all attendees
   *
   * @returns {number} Total price
   */
  const calculateTotalPrice = useCallback(() => {
    return formData.attendees.reduce((total, attendee) => {
      return total + calculatePrice(attendee.category, currentTier);
    }, 0);
  }, [formData.attendees, currentTier]);

  /**
   * Validates the personal information step (church info + attendees)
   *
   * @returns {boolean} True if valid
   */
  const validatePersonalInfo = useCallback(() => {
    const newErrors = {};
    const newAttendeeErrors = {};

    // Validate church info
    if (!formData.churchName.trim()) {
      newErrors.churchName = 'Church name is required';
    }
    if (!formData.churchCity.trim()) {
      newErrors.churchCity = 'City is required';
    }
    if (!formData.churchProvince.trim()) {
      newErrors.churchProvince = 'Province/Region is required';
    }

    // Validate each attendee
    formData.attendees.forEach((attendee, index) => {
      const attendeeErr = {};

      if (!attendee.lastName.trim()) {
        attendeeErr.lastName = 'Last name is required';
      }
      if (!attendee.firstName.trim()) {
        attendeeErr.firstName = 'First name is required';
      }
      if (!attendee.cellphone.trim()) {
        attendeeErr.cellphone = 'Cellphone number is required';
      } else if (!isValidPhoneNumber(attendee.cellphone)) {
        attendeeErr.cellphone = 'Please enter a valid Philippine cellphone number';
      }
      if (!attendee.email.trim()) {
        attendeeErr.email = 'Email is required';
      } else if (!isValidEmail(attendee.email)) {
        attendeeErr.email = 'Please enter a valid email address';
      }
      if (!attendee.ministryRole) {
        attendeeErr.ministryRole = 'Ministry role is required';
      }

      if (Object.keys(attendeeErr).length > 0) {
        newAttendeeErrors[index] = attendeeErr;
      }
    });

    setErrors(newErrors);
    setAttendeeErrors(newAttendeeErrors);

    return Object.keys(newErrors).length === 0 && Object.keys(newAttendeeErrors).length === 0;
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
    const totalAmount = calculateTotalPrice();

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

              <div className={styles.churchSummary}>
                <h3>Church Information</h3>
                <p><strong>{formData.churchName}</strong></p>
                <p>{formData.churchCity}, {formData.churchProvince}</p>
              </div>

              <h3>Attendees ({formData.attendees.length})</h3>
              {formData.attendees.map((attendee, index) => (
                <div key={attendee.id} className={styles.attendeeSummary}>
                  <div className={styles.attendeeNumber}>#{index + 1}</div>
                  <div className={styles.attendeeDetails}>
                    <p className={styles.attendeeName}>
                      {attendee.lastName}, {attendee.firstName} {attendee.middleName}
                    </p>
                    <p>{attendee.email} | {attendee.cellphone}</p>
                    <p>{attendee.ministryRole} | {REGISTRATION_CATEGORY_LABELS[attendee.category]}</p>
                    <p className={styles.attendeePrice}>
                      {formatPrice(calculatePrice(attendee.category, currentTier))}
                    </p>
                  </div>
                </div>
              ))}

              <div className={styles.amountDue}>
                <span>Total Amount Paid</span>
                <span className={styles.amountValue}>{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <div className={styles.nextSteps}>
              <h2>What&apos;s Next?</h2>
              <ol>
                <li>Your payment will be verified within 24-48 hours.</li>
                <li>Confirmation emails will be sent to all registered attendees.</li>
                <li>Please save your Registration ID: <strong>{registrationId}</strong></li>
                <li>Present your confirmation email or Registration ID at the event.</li>
              </ol>
            </div>

            <div className={styles.eventDetails}>
              <h2>Event Details</h2>
              <p><strong>Date:</strong> March 28, {CONFERENCE.YEAR}</p>
              <p><strong>Venue:</strong> {VENUE.NAME}</p>
              <p><strong>Address:</strong> {VENUE.ADDRESS}</p>
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
              <h2>Church & Attendee Information</h2>
              <p className={styles.stepDescription}>
                Enter your church details and add all attendees from your group.
              </p>

              <div className={styles.sectionDivider}>
                <span>Church Information</span>
              </div>

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

              <div className={styles.sectionDivider}>
                <span>Attendees ({formData.attendees.length})</span>
              </div>

              {formData.attendees.map((attendee, index) => (
                <div key={attendee.id} className={styles.attendeeCard}>
                  <div className={styles.attendeeHeader}>
                    <h3>Attendee #{index + 1}</h3>
                    {formData.attendees.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeAttendee(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className={styles.formRow3}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Last Name <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        className={`${styles.input} ${attendeeErrors[index]?.lastName ? styles.inputError : ''}`}
                        value={attendee.lastName}
                        onChange={(e) => updateAttendee(index, 'lastName', e.target.value)}
                        placeholder="Dela Cruz"
                      />
                      {attendeeErrors[index]?.lastName && (
                        <span className={styles.errorMessage}>{attendeeErrors[index].lastName}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        First Name <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        className={`${styles.input} ${attendeeErrors[index]?.firstName ? styles.inputError : ''}`}
                        value={attendee.firstName}
                        onChange={(e) => updateAttendee(index, 'firstName', e.target.value)}
                        placeholder="Juan"
                      />
                      {attendeeErrors[index]?.firstName && (
                        <span className={styles.errorMessage}>{attendeeErrors[index].firstName}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Middle Name</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={attendee.middleName}
                        onChange={(e) => updateAttendee(index, 'middleName', e.target.value)}
                        placeholder="Santos"
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Cellphone Number <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="tel"
                        className={`${styles.input} ${attendeeErrors[index]?.cellphone ? styles.inputError : ''}`}
                        value={attendee.cellphone}
                        onChange={(e) => updateAttendee(index, 'cellphone', e.target.value)}
                        placeholder="09XX-XXX-XXXX"
                      />
                      {attendeeErrors[index]?.cellphone && (
                        <span className={styles.errorMessage}>{attendeeErrors[index].cellphone}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Email Address <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="email"
                        className={`${styles.input} ${attendeeErrors[index]?.email ? styles.inputError : ''}`}
                        value={attendee.email}
                        onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                        placeholder="email@example.com"
                      />
                      {attendeeErrors[index]?.email && (
                        <span className={styles.errorMessage}>{attendeeErrors[index].email}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Ministry Role <span className={styles.required}>*</span>
                      </label>
                      <select
                        className={`${styles.select} ${attendeeErrors[index]?.ministryRole ? styles.inputError : ''}`}
                        value={attendee.ministryRole}
                        onChange={(e) => updateAttendee(index, 'ministryRole', e.target.value)}
                      >
                        <option value="">Select role</option>
                        {MINISTRY_ROLES.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      {attendeeErrors[index]?.ministryRole && (
                        <span className={styles.errorMessage}>{attendeeErrors[index].ministryRole}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Category <span className={styles.required}>*</span>
                      </label>
                      <select
                        className={styles.select}
                        value={attendee.category}
                        onChange={(e) => updateAttendee(index, 'category', e.target.value)}
                      >
                        {Object.entries(REGISTRATION_CATEGORIES).map(([key, value]) => (
                          <option key={key} value={value}>
                            {REGISTRATION_CATEGORY_LABELS[value]} - {formatPrice(calculatePrice(value, currentTier))}
                          </option>
                        ))}
                      </select>
                      {requiresProof(attendee.category) && (
                        <span className={styles.proofHint}>
                          Valid ID required at check-in
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className={styles.addButton}
                onClick={addAttendee}
              >
                + Add Another Attendee
              </button>

              <div className={styles.subtotalBox}>
                <span>Subtotal ({formData.attendees.length} attendee{formData.attendees.length > 1 ? 's' : ''})</span>
                <strong>{formatPrice(calculateTotalPrice())}</strong>
              </div>
            </div>
          )}

          {/* Step 2: Ticket Selection / Terms */}
          {currentStep === REGISTRATION_STEPS.TICKET_SELECTION && (
            <div className={styles.formStep}>
              <h2>Review & Accept Terms</h2>
              <p className={styles.stepDescription}>
                Review your registration details and accept the terms.
              </p>

              <div className={styles.reviewSection}>
                <h3>Church</h3>
                <p className={styles.reviewValue}>{formData.churchName}</p>
                <p className={styles.reviewValueSmall}>{formData.churchCity}, {formData.churchProvince}</p>
              </div>

              <div className={styles.reviewSection}>
                <h3>Attendees ({formData.attendees.length})</h3>
                <div className={styles.attendeeList}>
                  {formData.attendees.map((attendee, index) => (
                    <div key={attendee.id} className={styles.attendeeListItem}>
                      <span className={styles.attendeeListName}>
                        {index + 1}. {attendee.firstName} {attendee.lastName}
                      </span>
                      <span className={styles.attendeeListCategory}>
                        {REGISTRATION_CATEGORY_LABELS[attendee.category]}
                      </span>
                      <span className={styles.attendeeListPrice}>
                        {formatPrice(calculatePrice(attendee.category, currentTier))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.totalSection}>
                <span>Total Amount</span>
                <span className={styles.totalAmount}>{formatPrice(calculateTotalPrice())}</span>
              </div>

              {formData.attendees.some((a) => requiresProof(a.category)) && (
                <div className={styles.proofNote}>
                  <strong>Note:</strong> Attendees registered as Student/Senior Citizen must bring a valid ID for verification at check-in.
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
                    <p><strong>Account Name:</strong> {PAYMENT_INFO.GCASH.NAME}</p>
                    <p><strong>Number:</strong> {PAYMENT_INFO.GCASH.NUMBER}</p>
                  </div>

                  <div className={styles.paymentMethod}>
                    <h4>Bank Transfer</h4>
                    <p><strong>Account Name:</strong> {PAYMENT_INFO.BANK.NAME}</p>
                    <p><strong>Bank:</strong> {PAYMENT_INFO.BANK.BANK_NAME}</p>
                    <p><strong>Account No:</strong> {PAYMENT_INFO.BANK.ACCOUNT_NUMBER}</p>
                  </div>
                </div>

                <div className={styles.amountBox}>
                  <span>Total Amount to Pay ({formData.attendees.length} attendee{formData.attendees.length > 1 ? 's' : ''}):</span>
                  <strong>{formatPrice(calculateTotalPrice())}</strong>
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
              <h2>Confirm Your Registration</h2>
              <p className={styles.stepDescription}>
                Please review all information before submitting.
              </p>

              <div className={styles.reviewSection}>
                <h3>Church Information</h3>
                <div className={styles.reviewGrid}>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Church</span>
                    <span className={styles.reviewValue}>{formData.churchName}</span>
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
                <h3>Attendees ({formData.attendees.length})</h3>
                {formData.attendees.map((attendee, index) => (
                  <div key={attendee.id} className={styles.attendeeSummary}>
                    <div className={styles.attendeeNumber}>#{index + 1}</div>
                    <div className={styles.attendeeDetails}>
                      <p className={styles.attendeeName}>
                        {attendee.lastName}, {attendee.firstName} {attendee.middleName}
                      </p>
                      <p>{attendee.email} | {attendee.cellphone}</p>
                      <p>{attendee.ministryRole} | {REGISTRATION_CATEGORY_LABELS[attendee.category]}</p>
                    </div>
                    <div className={styles.attendeePrice}>
                      {formatPrice(calculatePrice(attendee.category, currentTier))}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.reviewSection}>
                <h3>Payment</h3>
                <div className={styles.reviewGrid}>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Payment Uploaded</span>
                    <span className={styles.reviewValue}>{formData.paymentFileName}</span>
                  </div>
                  {formData.invoiceRequest && (
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Invoice Requested</span>
                      <span className={styles.reviewValue}>Yes - {formData.invoiceName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.totalSection}>
                <span>Total Amount</span>
                <span className={styles.totalAmount}>{formatPrice(calculateTotalPrice())}</span>
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
