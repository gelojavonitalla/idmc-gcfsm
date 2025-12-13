import { useState } from 'react';
import {
  CONFERENCE,
  VENUE,
  PRICING_CATEGORIES,
  REGISTRATION_FIELDS,
} from '../constants';
import styles from './RegisterPage.module.css';

/**
 * RegisterPage Component
 * Registration form for the IDMC Conference.
 *
 * @returns {JSX.Element} The registration page component
 */
function RegisterPage() {
  const [formData, setFormData] = useState({
    pricingCategory: '',
    lastName: '',
    firstName: '',
    middleName: '',
    cellphone: '',
    email: '',
    churchName: '',
    ministryRole: '',
    churchLocation: '',
    paymentUpload: null,
    invoiceRequest: false,
    invoiceName: '',
    invoiceTin: '',
    invoiceAddress: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  /**
   * Handles input field changes
   * @param {Event} e - The change event
   */
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      setFormData((prev) => ({ ...prev, [name]: files[0] || null }));
    } else if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Validates the form data
   * @returns {boolean} Whether the form is valid
   */
  const validateForm = () => {
    const newErrors = {};

    // Pricing category
    if (!formData.pricingCategory) {
      newErrors.pricingCategory = 'Please select a registration category';
    }

    // Personal info validation
    REGISTRATION_FIELDS.personalInfo.forEach((field) => {
      if (field.required && !formData[field.id]?.trim()) {
        newErrors[field.id] = `${field.label} is required`;
      }
    });

    // Email format validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Cellphone format validation
    if (formData.cellphone && !/^[0-9+\-\s()]+$/.test(formData.cellphone)) {
      newErrors.cellphone = 'Please enter a valid phone number';
    }

    // Church info validation
    REGISTRATION_FIELDS.churchInfo.forEach((field) => {
      if (field.required && !formData[field.id]?.trim()) {
        newErrors[field.id] = `${field.label} is required`;
      }
    });

    // Payment upload validation
    if (!formData.paymentUpload) {
      newErrors.paymentUpload = 'Please upload proof of payment';
    }

    // Invoice fields validation (only if invoice is requested)
    if (formData.invoiceRequest) {
      if (!formData.invoiceName?.trim()) {
        newErrors.invoiceName = 'Name in Invoice is required';
      }
      if (!formData.invoiceTin?.trim()) {
        newErrors.invoiceTin = 'TIN is required';
      }
      if (!formData.invoiceAddress?.trim()) {
        newErrors.invoiceAddress = 'Billing Address is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   * @param {Event} e - The submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // TODO: Implement actual form submission to backend/Firebase
      // For now, simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSubmitStatus('success');
      // Reset form after successful submission
      setFormData({
        pricingCategory: '',
        lastName: '',
        firstName: '',
        middleName: '',
        cellphone: '',
        email: '',
        churchName: '',
        ministryRole: '',
        churchLocation: '',
        paymentUpload: null,
        invoiceRequest: false,
        invoiceName: '',
        invoiceTin: '',
        invoiceAddress: '',
      });
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Gets the selected pricing category details
   * @returns {Object|null} The selected category or null
   */
  const getSelectedCategory = () => {
    return PRICING_CATEGORIES.find((cat) => cat.id === formData.pricingCategory);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className="container">
          <h1>Register for IDMC {CONFERENCE.YEAR}</h1>
          <p className={styles.subtitle}>
            March 28, {CONFERENCE.YEAR} | {VENUE.NAME}
          </p>
        </div>
      </div>

      <div className="container">
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Pricing Category Selection */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Registration Category</h2>
            <div className={styles.pricingOptions}>
              {PRICING_CATEGORIES.map((category) => (
                <label
                  key={category.id}
                  className={`${styles.pricingOption} ${
                    formData.pricingCategory === category.id
                      ? styles.pricingOptionSelected
                      : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="pricingCategory"
                    value={category.id}
                    checked={formData.pricingCategory === category.id}
                    onChange={handleChange}
                    className={styles.radioInput}
                  />
                  <div className={styles.pricingContent}>
                    <span className={styles.pricingName}>{category.name}</span>
                    <span className={styles.pricingPrice}>
                      PHP {category.price}
                    </span>
                    <span className={styles.pricingDesc}>
                      {category.description}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            {errors.pricingCategory && (
              <p className={styles.error}>{errors.pricingCategory}</p>
            )}
          </section>

          {/* Personal Information */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Personal Information</h2>
            <div className={styles.fieldGrid}>
              {REGISTRATION_FIELDS.personalInfo.map((field) => (
                <div
                  key={field.id}
                  className={`${styles.field} ${
                    field.id === 'email' ? styles.fieldFull : ''
                  }`}
                >
                  <label htmlFor={field.id} className={styles.label}>
                    {field.label}
                    {field.required && (
                      <span className={styles.required}>*</span>
                    )}
                  </label>
                  <input
                    type={field.type}
                    id={field.id}
                    name={field.id}
                    value={formData[field.id]}
                    onChange={handleChange}
                    className={`${styles.input} ${
                      errors[field.id] ? styles.inputError : ''
                    }`}
                  />
                  {errors[field.id] && (
                    <p className={styles.error}>{errors[field.id]}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Church Information */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Church Information</h2>
            <div className={styles.fieldGrid}>
              {REGISTRATION_FIELDS.churchInfo.map((field) => (
                <div
                  key={field.id}
                  className={`${styles.field} ${
                    field.id === 'churchLocation' ? styles.fieldFull : ''
                  }`}
                >
                  <label htmlFor={field.id} className={styles.label}>
                    {field.label}
                    {field.required && (
                      <span className={styles.required}>*</span>
                    )}
                  </label>
                  <input
                    type={field.type}
                    id={field.id}
                    name={field.id}
                    value={formData[field.id]}
                    onChange={handleChange}
                    className={`${styles.input} ${
                      errors[field.id] ? styles.inputError : ''
                    }`}
                  />
                  {errors[field.id] && (
                    <p className={styles.error}>{errors[field.id]}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Payment Upload */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Payment</h2>
            {getSelectedCategory() && (
              <div className={styles.paymentSummary}>
                <p>
                  Amount to pay:{' '}
                  <strong>PHP {getSelectedCategory().price}</strong>
                </p>
                <p className={styles.paymentNote}>
                  Please send payment via GCash or bank transfer and upload the
                  screenshot below.
                </p>
              </div>
            )}
            <div className={styles.field}>
              <label htmlFor="paymentUpload" className={styles.label}>
                Upload Payment Proof
                <span className={styles.required}>*</span>
              </label>
              <input
                type="file"
                id="paymentUpload"
                name="paymentUpload"
                accept="image/*,.pdf"
                onChange={handleChange}
                className={`${styles.fileInput} ${
                  errors.paymentUpload ? styles.inputError : ''
                }`}
              />
              {formData.paymentUpload && (
                <p className={styles.fileName}>{formData.paymentUpload.name}</p>
              )}
              {errors.paymentUpload && (
                <p className={styles.error}>{errors.paymentUpload}</p>
              )}
            </div>
          </section>

          {/* Invoice Request */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Invoice Request (Optional)</h2>
            <div className={styles.checkboxField}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="invoiceRequest"
                  checked={formData.invoiceRequest}
                  onChange={handleChange}
                  className={styles.checkbox}
                />
                <span>I need an official invoice/receipt</span>
              </label>
            </div>

            {formData.invoiceRequest && (
              <div className={styles.invoiceFields}>
                <div className={styles.field}>
                  <label htmlFor="invoiceName" className={styles.label}>
                    Name in Invoice
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="invoiceName"
                    name="invoiceName"
                    value={formData.invoiceName}
                    onChange={handleChange}
                    className={`${styles.input} ${
                      errors.invoiceName ? styles.inputError : ''
                    }`}
                  />
                  {errors.invoiceName && (
                    <p className={styles.error}>{errors.invoiceName}</p>
                  )}
                </div>
                <div className={styles.field}>
                  <label htmlFor="invoiceTin" className={styles.label}>
                    TIN (Tax Identification Number)
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="invoiceTin"
                    name="invoiceTin"
                    value={formData.invoiceTin}
                    onChange={handleChange}
                    className={`${styles.input} ${
                      errors.invoiceTin ? styles.inputError : ''
                    }`}
                  />
                  {errors.invoiceTin && (
                    <p className={styles.error}>{errors.invoiceTin}</p>
                  )}
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label htmlFor="invoiceAddress" className={styles.label}>
                    Billing Address
                    <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="invoiceAddress"
                    name="invoiceAddress"
                    value={formData.invoiceAddress}
                    onChange={handleChange}
                    rows={3}
                    className={`${styles.textarea} ${
                      errors.invoiceAddress ? styles.inputError : ''
                    }`}
                  />
                  {errors.invoiceAddress && (
                    <p className={styles.error}>{errors.invoiceAddress}</p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Submit Button */}
          <div className={styles.submitSection}>
            {submitStatus === 'success' && (
              <div className={styles.successMessage}>
                Registration submitted successfully! We will contact you via
                email to confirm your registration.
              </div>
            )}
            {submitStatus === 'error' && (
              <div className={styles.errorMessage}>
                Something went wrong. Please try again.
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.submitButton}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
