import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSettings } from '../context';
import {
  REGISTRATION_STEPS,
  REGISTRATION_STEP_LABELS,
  MINISTRY_ROLES,
  ROUTES,
  BANK_LABELS,
  PAYMENT_METHODS,
  BANK_ACCOUNT_TYPES,
  BANK_NAMES,
} from '../constants';
import {
  generateRegistrationId,
  formatPrice,
  isValidEmail,
  isValidPhoneNumber,
} from '../utils';
import {
  createRegistration,
  uploadPaymentProof,
  getRegistrationByEmail,
  getActiveBankAccounts,
  REGISTRATION_ERROR_CODES,
} from '../services';
import { getPublishedWorkshops } from '../services/workshops';
import { getFoodMenuSettings, getAllFoodMenuItems } from '../services/foodMenu';
import { FOOD_MENU_STATUS } from '../constants';
import { processReceipt } from '../tesseract';
import WorkshopSelector from '../components/workshops/WorkshopSelector';
import styles from './RegisterPage.module.css';

/**
 * Counter for generating unique attendee IDs within a session
 */
let attendeeIdCounter = 0;

/**
 * Creates a new empty additional attendee object with a unique ID.
 * Additional attendees have required phone but optional email.
 *
 * @returns {Object} Empty additional attendee data
 */
const createEmptyAdditionalAttendee = () => {
  attendeeIdCounter += 1;
  const uniqueId = `${Date.now()}-${attendeeIdCounter}-${Math.random().toString(36).substring(2, 8)}`;
  return {
    id: uniqueId,
    lastName: '',
    firstName: '',
    middleName: '',
    cellphone: '',
    email: '', // Optional for additional attendees
    ministryRole: '',
    category: 'regular', // Default category key - will be validated against database categories
    workshopSelections: [], // Array of { sessionId, sessionTitle, timeSlot }
    foodChoice: '', // Selected food menu item ID
  };
};

/**
 * Initial form data structure for registration
 * Primary attendee requires email + phone for all communications
 * Additional attendees require phone (for SMS) but email is optional
 */
const INITIAL_FORM_DATA = {
  // Church Information (shared)
  churchName: '',
  churchCity: '',
  churchProvince: '',

  // Primary attendee (required: email, emailConfirm, phone)
  primaryAttendee: {
    lastName: '',
    firstName: '',
    middleName: '',
    cellphone: '',
    email: '',
    emailConfirm: '',
    ministryRole: '',
    category: 'regular', // Default category key - will be validated against database categories
    workshopSelections: [], // Array of { sessionId, sessionTitle, timeSlot }
    foodChoice: '', // Selected food menu item ID
  },

  // Additional attendees (required: phone; optional: email)
  additionalAttendees: [],

  // Payment
  paymentMethod: PAYMENT_METHODS.BANK_TRANSFER, // Default to bank transfer
  selectedBankAccountId: '',
  paymentAmount: '',
  paymentDate: '',
  paymentTime: '',
  paymentReferenceNumber: '',
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
  const { settings, pricingTiers } = useSettings();
  const [searchParams] = useSearchParams();

  /**
   * Get available pricing tiers from the database
   * Each tier has: id, name, regularPrice, studentPrice
   */
  const availablePricingTiers = useMemo(() => {
    if (!pricingTiers || pricingTiers.length === 0) return [];
    // Filter to only active tiers and sort by price
    return pricingTiers
      .filter(tier => tier.isActive)
      .sort((a, b) => a.regularPrice - b.regularPrice);
  }, [pricingTiers]);

  /**
   * Get initial form data with category from URL parameter if present
   */
  const initialFormData = useMemo(() => {
    const categoryParam = searchParams.get('category');
    // Validate category param against available tier IDs
    const validTierIds = availablePricingTiers.map(tier => tier.id);
    const defaultTierId = validTierIds[0] || '';
    const category = validTierIds.includes(categoryParam)
      ? categoryParam
      : defaultTierId;

    return {
      ...INITIAL_FORM_DATA,
      primaryAttendee: {
        ...INITIAL_FORM_DATA.primaryAttendee,
        category,
      },
    };
  }, [searchParams, availablePricingTiers]);

  const [currentStep, setCurrentStep] = useState(REGISTRATION_STEPS.PERSONAL_INFO);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [primaryErrors, setPrimaryErrors] = useState({});
  const [additionalErrors, setAdditionalErrors] = useState({});
  const [registrationId, setRegistrationId] = useState(null);
  const [shortCode, setShortCode] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [duplicateRegistration, setDuplicateRegistration] = useState(null);
  const [isFromGCF, setIsFromGCF] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);
  const [workshops, setWorkshops] = useState([]);
  const [loadingWorkshops, setLoadingWorkshops] = useState(false);
  const [foodMenuItems, setFoodMenuItems] = useState([]);
  const [foodSelectionEnabled, setFoodSelectionEnabled] = useState(false);
  const [loadingFoodMenu, setLoadingFoodMenu] = useState(false);

  // OCR-related state
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrParsedFields, setOcrParsedFields] = useState({
    amount: null,
    date: null,
    time: null,
    referenceNumber: null,
  });
  const [ocrModifiedFields, setOcrModifiedFields] = useState({
    amount: false,
    date: false,
    time: false,
    referenceNumber: false,
  });

  /**
   * Get the currently selected pricing tier based on the primary attendee's category
   */
  const currentTier = useMemo(() => {
    return availablePricingTiers.find(tier => tier.id === formData.primaryAttendee.category);
  }, [availablePricingTiers, formData.primaryAttendee.category]);

  const registrationOpen = settings.registrationOpen !== false;

  /**
   * Fetches active bank accounts on component mount
   */
  useEffect(() => {
    const fetchBankAccounts = async () => {
      setLoadingBankAccounts(true);
      try {
        const accounts = await getActiveBankAccounts();
        setBankAccounts(accounts);
      } catch (error) {
        console.error('Failed to fetch bank accounts:', error);
      } finally {
        setLoadingBankAccounts(false);
      }
    };

    fetchBankAccounts();
  }, []);

  /**
   * Fetches published workshops on component mount
   */
  useEffect(() => {
    const fetchWorkshops = async () => {
      setLoadingWorkshops(true);
      try {
        const publishedWorkshops = await getPublishedWorkshops();
        setWorkshops(publishedWorkshops);
      } catch (error) {
        console.error('Failed to fetch workshops:', error);
      } finally {
        setLoadingWorkshops(false);
      }
    };

    fetchWorkshops();
  }, []);

  /**
   * Fetches food menu settings and published items on component mount
   */
  useEffect(() => {
    const fetchFoodMenu = async () => {
      setLoadingFoodMenu(true);
      try {
        const settings = await getFoodMenuSettings();
        setFoodSelectionEnabled(settings.foodSelectionEnabled || false);

        if (settings.foodSelectionEnabled) {
          const items = await getAllFoodMenuItems();
          // Filter to only show published items
          const publishedItems = items.filter(
            (item) => item.status === FOOD_MENU_STATUS.PUBLISHED
          );
          setFoodMenuItems(publishedItems);
        }
      } catch (error) {
        console.error('Failed to fetch food menu:', error);
      } finally {
        setLoadingFoodMenu(false);
      }
    };

    fetchFoodMenu();
  }, []);

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
   * Updates a payment field and tracks OCR modifications
   *
   * @param {string} field - The field name (paymentAmount, paymentDate, paymentTime, paymentReferenceNumber)
   * @param {*} value - The new value
   */
  const updatePaymentField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));

    // Track if user modified OCR-parsed field
    const fieldMap = {
      paymentAmount: 'amount',
      paymentDate: 'date',
      paymentTime: 'time',
      paymentReferenceNumber: 'referenceNumber',
    };

    const ocrFieldKey = fieldMap[field];
    if (ocrFieldKey && ocrParsedFields[ocrFieldKey] !== null) {
      // Check if value differs from OCR parsed value
      const ocrValue = ocrFieldKey === 'amount'
        ? String(ocrParsedFields[ocrFieldKey])
        : ocrParsedFields[ocrFieldKey];

      if (String(value) !== String(ocrValue)) {
        setOcrModifiedFields((prev) => ({ ...prev, [ocrFieldKey]: true }));
      }
    }
  }, [ocrParsedFields]);

  /**
   * Updates primary attendee field value
   *
   * @param {string} field - The field name to update
   * @param {*} value - The new value
   */
  const updatePrimaryAttendee = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      primaryAttendee: { ...prev.primaryAttendee, [field]: value },
    }));
    setPrimaryErrors((prev) => ({ ...prev, [field]: null }));
  }, []);

  /**
   * Updates an additional attendee field value
   *
   * @param {number} index - The attendee index
   * @param {string} field - The field name to update
   * @param {*} value - The new value
   */
  const updateAdditionalAttendee = useCallback((index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      additionalAttendees: (prev.additionalAttendees || []).map((attendee, i) =>
        i === index ? { ...attendee, [field]: value } : attendee
      ),
    }));
    setAdditionalErrors((prev) => ({
      ...prev,
      [index]: { ...prev[index], [field]: null },
    }));
  }, []);

  /**
   * Adds a new additional attendee
   */
  const addAdditionalAttendee = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      additionalAttendees: [...(prev.additionalAttendees || []), createEmptyAdditionalAttendee()],
    }));
  }, []);

  /**
   * Removes an additional attendee
   *
   * @param {number} index - The attendee index to remove
   */
  const removeAdditionalAttendee = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      additionalAttendees: (prev.additionalAttendees || []).filter((_, i) => i !== index),
    }));
    setAdditionalErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  }, []);

  /**
   * Updates primary attendee workshop selections
   *
   * @param {Array} selections - Array of { sessionId, sessionTitle, timeSlot }
   */
  const updatePrimaryWorkshopSelections = useCallback((selections) => {
    setFormData((prev) => ({
      ...prev,
      primaryAttendee: { ...prev.primaryAttendee, workshopSelections: selections },
    }));
  }, []);

  /**
   * Updates additional attendee workshop selections
   *
   * @param {number} index - The attendee index
   * @param {Array} selections - Array of { sessionId, sessionTitle, timeSlot }
   */
  const updateAdditionalWorkshopSelections = useCallback((index, selections) => {
    setFormData((prev) => ({
      ...prev,
      additionalAttendees: (prev.additionalAttendees || []).map((attendee, i) =>
        i === index ? { ...attendee, workshopSelections: selections } : attendee
      ),
    }));
  }, []);

  /**
   * Handles file selection for payment upload.
   * Processes OCR to auto-populate payment details.
   * Note: Server-side validation should also verify actual file content,
   * as client-side MIME type checking can be bypassed.
   *
   * @param {Event} e - The file input change event
   */
  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          paymentFile: 'Please upload an image (JPG, PNG, GIF, or WebP)',
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

      // Process OCR
      setIsOcrProcessing(true);
      try {
        const result = await processReceipt(file);
        setOcrResult(result);

        // Parse date and time from suggestedDateTime
        let parsedDate = '';
        let parsedTime = '';
        if (result.winner?.suggestedDateTime) {
          // Try to parse ISO format: YYYY-MM-DDTHH:MM
          const dateTimeMatch = result.winner.suggestedDateTime.match(/(\d{4}-\d{2}-\d{2})(?:T|\s)?(\d{2}:\d{2})/);
          if (dateTimeMatch) {
            parsedDate = dateTimeMatch[1];
            parsedTime = dateTimeMatch[2];
          } else {
            // Try other common formats
            const dateMatch = result.winner.suggestedDateTime.match(/\d{4}-\d{2}-\d{2}/);
            const timeMatch = result.winner.suggestedDateTime.match(/\d{2}:\d{2}/);
            if (dateMatch) parsedDate = dateMatch[0];
            if (timeMatch) parsedTime = timeMatch[0];
          }
        }

        // Store OCR parsed values
        const parsedFields = {
          amount: result.winner?.suggestedAmount || null,
          date: parsedDate || null,
          time: parsedTime || null,
          referenceNumber: result.winner?.suggestedRef || null,
        };
        setOcrParsedFields(parsedFields);

        // Auto-populate form fields only if OCR found values
        setFormData((prev) => ({
          ...prev,
          paymentAmount: parsedFields.amount ? String(parsedFields.amount) : prev.paymentAmount,
          paymentDate: parsedFields.date || prev.paymentDate,
          paymentTime: parsedFields.time || prev.paymentTime,
          paymentReferenceNumber: parsedFields.referenceNumber || prev.paymentReferenceNumber,
        }));
      } catch (error) {
        console.error('OCR processing error:', error);
        // Continue without OCR - user can enter manually
      } finally {
        setIsOcrProcessing(false);
      }
    }
  }, []);

  /**
   * Gets the price for a pricing tier by ID
   * Uses regularPrice by default (studentPrice can be used based on attendee type)
   *
   * @param {string} tierId - The pricing tier ID
   * @returns {number} Tier price or 0 if not found
   */
  const getCategoryPrice = useCallback((tierId) => {
    const tier = availablePricingTiers.find(t => t.id === tierId);
    return tier?.regularPrice || 0;
  }, [availablePricingTiers]);

  /**
   * Gets the display name for a pricing tier by ID
   *
   * @param {string} tierId - The pricing tier ID
   * @returns {string} Tier name or the ID if not found
   */
  const getCategoryName = useCallback((tierId) => {
    const tier = availablePricingTiers.find(t => t.id === tierId);
    return tier?.name || tierId;
  }, [availablePricingTiers]);

  /**
   * Calculates total price for all attendees (primary + additional)
   *
   * @returns {number} Total price
   */
  const calculateTotalPrice = useCallback(() => {
    // Primary attendee price
    const primaryPrice = getCategoryPrice(formData.primaryAttendee.category);

    // Additional attendees price
    const additionalPrice = (formData.additionalAttendees || []).reduce((total, attendee) => {
      return total + getCategoryPrice(attendee.category);
    }, 0);

    return primaryPrice + additionalPrice;
  }, [formData.primaryAttendee.category, formData.additionalAttendees, getCategoryPrice]);

  /**
   * Checks if payment is required based on total amount
   * Payment is NOT required if total amount is 0 (all attendees are volunteers/speakers)
   *
   * @returns {boolean} True if payment is required
   */
  const isPaymentRequired = useCallback(() => {
    return calculateTotalPrice() > 0;
  }, [calculateTotalPrice]);

  /**
   * Gets total attendee count (primary + additional)
   *
   * @returns {number} Total attendee count
   */
  const getTotalAttendeeCount = useCallback(() => {
    return 1 + (formData.additionalAttendees?.length || 0);
  }, [formData.additionalAttendees?.length]);

  /**
   * Handles GCF checkbox toggle - Auto-fills church information with GCF details
   * Used for booth registrations to speed up the process
   *
   * @param {boolean} checked - Whether the checkbox is checked
   */
  const handleGCFCheckbox = useCallback((checked) => {
    setIsFromGCF(checked);
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        churchName: 'GCF South Metro',
        churchCity: 'Las Piñas City',
        churchProvince: 'Metro Manila / NCR',
      }));
      setErrors((prev) => ({
        ...prev,
        churchName: null,
        churchCity: null,
        churchProvince: null,
      }));
    }
  }, []);

  /**
   * Validates the personal information step (church info + primary + additional attendees)
   *
   * @returns {boolean} True if valid
   */
  const validatePersonalInfo = useCallback(() => {
    const newErrors = {};
    const newPrimaryErrors = {};
    const newAdditionalErrors = {};

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

    // Validate primary attendee (email + phone required)
    const primary = formData.primaryAttendee;

    if (!primary.lastName.trim()) {
      newPrimaryErrors.lastName = 'Last name is required';
    }
    if (!primary.firstName.trim()) {
      newPrimaryErrors.firstName = 'First name is required';
    }
    if (!primary.cellphone.trim()) {
      newPrimaryErrors.cellphone = 'Cellphone number is required';
    } else if (!isValidPhoneNumber(primary.cellphone)) {
      newPrimaryErrors.cellphone = 'Please enter a valid Philippine cellphone number';
    }
    if (!primary.email.trim()) {
      newPrimaryErrors.email = 'Email is required';
    } else if (!isValidEmail(primary.email)) {
      newPrimaryErrors.email = 'Please enter a valid email address';
    }
    if (!primary.emailConfirm.trim()) {
      newPrimaryErrors.emailConfirm = 'Please confirm your email';
    } else if (primary.email.trim().toLowerCase() !== primary.emailConfirm.trim().toLowerCase()) {
      newPrimaryErrors.emailConfirm = 'Email addresses do not match';
    }
    if (!primary.ministryRole) {
      newPrimaryErrors.ministryRole = 'Ministry role is required';
    }
    if (foodSelectionEnabled && foodMenuItems.length > 0 && !primary.foodChoice) {
      newPrimaryErrors.foodChoice = 'Food preference is required';
    }

    // Validate additional attendees (phone required, email optional)
    (formData.additionalAttendees || []).forEach((attendee, index) => {
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
      // Email is optional for additional attendees, but validate if provided
      if (attendee.email.trim() && !isValidEmail(attendee.email)) {
        attendeeErr.email = 'Please enter a valid email address';
      }
      if (!attendee.ministryRole) {
        attendeeErr.ministryRole = 'Ministry role is required';
      }
      if (foodSelectionEnabled && foodMenuItems.length > 0 && !attendee.foodChoice) {
        attendeeErr.foodChoice = 'Food preference is required';
      }

      if (Object.keys(attendeeErr).length > 0) {
        newAdditionalErrors[index] = attendeeErr;
      }
    });

    setErrors(newErrors);
    setPrimaryErrors(newPrimaryErrors);
    setAdditionalErrors(newAdditionalErrors);

    return (
      Object.keys(newErrors).length === 0 &&
      Object.keys(newPrimaryErrors).length === 0 &&
      Object.keys(newAdditionalErrors).length === 0
    );
  }, [formData, foodSelectionEnabled, foodMenuItems]);

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

    // Validation depends on payment method
    if (formData.paymentMethod === PAYMENT_METHODS.BANK_TRANSFER ||
        formData.paymentMethod === PAYMENT_METHODS.GCASH ||
        formData.paymentMethod === PAYMENT_METHODS.PAYMAYA) {
      // Bank transfer and e-wallet require account selection and payment proof
      if (!formData.selectedBankAccountId) {
        newErrors.selectedBankAccountId = formData.paymentMethod === PAYMENT_METHODS.BANK_TRANSFER
          ? 'Please select a bank account'
          : 'Please select an e-wallet account';
      }

      if (!formData.paymentFile) {
        newErrors.paymentFile = 'Please upload your payment screenshot or receipt';
      }

      if (!formData.paymentAmount || parseFloat(formData.paymentAmount) <= 0) {
        newErrors.paymentAmount = 'Please enter the amount you paid';
      }

      if (!formData.paymentDate) {
        newErrors.paymentDate = 'Please enter the payment date';
      }

      if (!formData.paymentTime) {
        newErrors.paymentTime = 'Please enter the payment time';
      }

      // Reference number is optional but recommended
    }
    // For CASH payment, no immediate validation needed - payment happens at booth

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
        // Skip payment step if no payment required (volunteers/speakers)
        if (isValid && !isPaymentRequired()) {
          setCurrentStep(REGISTRATION_STEPS.CONFIRMATION);
          window.scrollTo(0, 0);
          return;
        }
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
  }, [currentStep, validatePersonalInfo, validateTicketSelection, validatePaymentUpload, isPaymentRequired]);

  /**
   * Handles moving to the previous step
   */
  const handleBack = useCallback(() => {
    if (currentStep > REGISTRATION_STEPS.PERSONAL_INFO) {
      // If on confirmation and payment was skipped, go back to ticket selection
      if (currentStep === REGISTRATION_STEPS.CONFIRMATION && !isPaymentRequired()) {
        setCurrentStep(REGISTRATION_STEPS.TICKET_SELECTION);
      } else {
        setCurrentStep((prev) => prev - 1);
      }
      window.scrollTo(0, 0);
    }
  }, [currentStep, isPaymentRequired]);

  /**
   * Handles form submission - saves to Firestore with payment proof upload
   */
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setUploadProgress(0);

    try {
      // Generate registration ID
      const { registrationId: newRegId, shortCode: newShortCode } = generateRegistrationId();

      // Check for duplicate email first
      const existing = await getRegistrationByEmail(formData.primaryAttendee.email);
      if (existing) {
        setDuplicateRegistration(existing);
        setSubmitError('This email is already registered. Please use a different email or check your existing registration.');
        setIsSubmitting(false);
        return;
      }

      // Upload payment proof first
      let paymentProofUrl = null;
      if (formData.paymentFile) {
        paymentProofUrl = await uploadPaymentProof(
          formData.paymentFile,
          newRegId,
          (progress) => setUploadProgress(progress)
        );
      }

      // Prepare registration data
      const registrationData = {
        registrationId: newRegId,
        shortCode: newShortCode,
        primaryAttendee: {
          lastName: formData.primaryAttendee.lastName,
          firstName: formData.primaryAttendee.firstName,
          middleName: formData.primaryAttendee.middleName || '',
          cellphone: formData.primaryAttendee.cellphone,
          email: formData.primaryAttendee.email,
          ministryRole: formData.primaryAttendee.ministryRole,
          category: formData.primaryAttendee.category,
          workshopSelection: formData.primaryAttendee.workshopSelection || '',
          foodChoice: formData.primaryAttendee.foodChoice || '',
        },
        additionalAttendees: (formData.additionalAttendees || []).map((attendee) => ({
          lastName: attendee.lastName,
          firstName: attendee.firstName,
          middleName: attendee.middleName || '',
          cellphone: attendee.cellphone,
          email: attendee.email || '',
          ministryRole: attendee.ministryRole,
          category: attendee.category,
          foodChoice: attendee.foodChoice || '',
        })),
        church: {
          name: formData.churchName,
          city: formData.churchCity,
          province: formData.churchProvince,
        },
        payment: {
          method: formData.paymentMethod,
          proofUrl: paymentProofUrl,
          uploadedAt: paymentProofUrl ? new Date().toISOString() : null,
          bankAccountId: formData.selectedBankAccountId || null,
          amountPaid: parseFloat(formData.paymentAmount) || 0,
          paymentDate: formData.paymentDate || null,
          paymentTime: formData.paymentTime || null,
          referenceNumber: formData.paymentReferenceNumber || '',
          // OCR metadata for tracking accuracy
          ocrData: ocrResult ? {
            confidence: ocrResult.confidence,
            source: ocrResult.source || 'tesseract',
            parsedFields: ocrParsedFields,
            modifiedFields: ocrModifiedFields,
            rawText: ocrResult.rawText,
          } : null,
        },
        invoice: formData.invoiceRequest ? {
          requested: true,
          name: formData.invoiceName,
          tin: formData.tin,
          address: formData.invoiceAddress,
        } : null,
        totalAmount: calculateTotalPrice(),
        pricingTier: currentTier?.id || 'standard',
      };

      // Save to Firestore
      await createRegistration(registrationData);

      // Update state on success
      setRegistrationId(newRegId);
      setShortCode(newShortCode);
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Registration error:', error);

      if (error.code === REGISTRATION_ERROR_CODES.DUPLICATE_EMAIL) {
        setDuplicateRegistration({ registrationId: error.existingRegistrationId });
        setSubmitError('This email is already registered. Please use a different email or check your existing registration.');
      } else {
        setSubmitError(error.message || 'Failed to submit registration. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, currentTier, calculateTotalPrice, ocrModifiedFields, ocrParsedFields, ocrResult]);

  // Registration closed state
  if (!registrationOpen) {
    return (
      <div className={styles.page}>
        <section className={styles.heroSection}>
          <h1 className={styles.heroTitle}>Registration Closed</h1>
          <p className={styles.heroSubtitle}>{settings.title}</p>
        </section>
        <section className={styles.contentSection}>
          <div className={styles.container}>
            <div className={styles.closedMessage}>
              <p>
                Registration for {settings.title} has ended. Thank you for your
                interest!
              </p>
              <p>
                If you have any questions, please contact us at{' '}
                <a href={`mailto:${settings.contact?.email}`}>{settings.contact?.email}</a>
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Submitted/Confirmation state
  if (isSubmitted) {
    const totalAmount = calculateTotalPrice();
    const totalAttendees = getTotalAttendeeCount();
    const primary = formData.primaryAttendee;

    return (
      <div className={styles.page}>
        <section className={styles.heroSection}>
          <div className={styles.checkIcon}>✓</div>
          <h1 className={styles.heroTitle}>Registration Submitted!</h1>
          <p className={styles.heroSubtitle}>
            Quick Code: <strong>{shortCode}</strong>
          </p>
        </section>
        <section className={styles.contentSection}>
          <div className={styles.container}>
            <div className={styles.confirmationCard}>
              <div className={styles.confirmationDetails}>
                <h2>Registration Summary</h2>

                <div className={styles.regIdBox}>
                  <div className={styles.regIdLabel}>Your Registration ID</div>
                  <div className={styles.regIdValue}>{registrationId}</div>
                  <div className={styles.shortCodeHint}>
                    Quick code for check-in: <strong>{shortCode}</strong>
                  </div>
                </div>

                <div className={styles.churchSummary}>
                  <h3>Church Information</h3>
                  <p><strong>{formData.churchName}</strong></p>
                  <p>{formData.churchCity}, {formData.churchProvince}</p>
                </div>

                <h3>Primary Contact</h3>
                <div className={styles.attendeeSummary}>
                  <div className={styles.attendeeNumber}>
                    <span className={styles.primaryBadge}>Primary</span>
                  </div>
                  <div className={styles.attendeeDetails}>
                    <p className={styles.attendeeName}>
                      {primary.lastName}, {primary.firstName} {primary.middleName}
                    </p>
                    <p>{primary.email} | {primary.cellphone}</p>
                    <p>{primary.ministryRole} | {getCategoryName(primary.category)}</p>
                    <p className={styles.attendeePrice}>
                      {formatPrice(getCategoryPrice(primary.category))}
                    </p>
                  </div>
                </div>

                {formData.additionalAttendees?.length > 0 && (
                  <>
                    <h3>Additional Attendees ({formData.additionalAttendees?.length || 0})</h3>
                    {(formData.additionalAttendees || []).map((attendee, index) => (
                      <div key={attendee.id} className={styles.attendeeSummary}>
                        <div className={styles.attendeeNumber}>#{index + 2}</div>
                        <div className={styles.attendeeDetails}>
                          <p className={styles.attendeeName}>
                            {attendee.lastName}, {attendee.firstName} {attendee.middleName}
                          </p>
                          <p>
                            {attendee.email || '(No email)'} | {attendee.cellphone}
                          </p>
                          <p>{attendee.ministryRole} | {getCategoryName(attendee.category)}</p>
                          <p className={styles.attendeePrice}>
                            {formatPrice(getCategoryPrice(attendee.category))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                <div className={styles.amountDue}>
                  <span>Total Amount ({totalAttendees} attendee{totalAttendees > 1 ? 's' : ''})</span>
                  <span className={styles.amountValue}>{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <div className={styles.nextSteps}>
                <h2>What&apos;s Next?</h2>
                <ol>
                  <li>Your payment will be verified within 24-48 hours.</li>
                  <li>
                    <strong>{primary.email}</strong> will receive confirmation and QR codes for all attendees.
                  </li>
                  <li>
                    All attendees will receive their registration code via SMS.
                  </li>
                  <li>
                    Save your quick code: <strong>{shortCode}</strong> for easy check-in.
                  </li>
                </ol>
              </div>

              <div className={styles.recoveryInfo}>
                <h2>Lost Your Confirmation?</h2>
                <p>
                  You can retrieve your registration anytime.{' '}
                  <a href={ROUTES.REGISTRATION_STATUS}>Check Registration Status</a>
                </p>
                <p>Use your email, phone number, or registration ID to look up your registration.</p>
              </div>

              <div className={styles.eventDetails}>
                <h2>Event Details</h2>
                <p><strong>Date:</strong> {new Date(settings.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                <p><strong>Venue:</strong> {settings.venue?.name}</p>
                <p><strong>Address:</strong> {settings.venue?.address}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Main form state
  return (
    <div className={styles.page}>
      <section className={styles.heroSection}>
        <h1 className={styles.heroTitle}>Register for {settings.title}</h1>
        <p className={styles.heroSubtitle}>
          {settings.theme} | {new Date(settings.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.container}>
          {/* Registration Status Link */}
          <div className={styles.statusLinkBox}>
            <p>
              Already registered?{' '}
              <a href={ROUTES.REGISTRATION_STATUS}>
                Check your registration status
              </a>
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
                Enter your church details and attendee information.
              </p>

              <div className={styles.sectionDivider}>
                <span>Church Information</span>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={isFromGCF}
                      onChange={(e) => handleGCFCheckbox(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span>From GCF South Metro</span>
                  </label>
                </div>
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

              {/* Primary Contact Section */}
              <div className={styles.sectionDivider}>
                <span>Primary Contact</span>
              </div>
              <p className={styles.sectionHint}>
                This person will receive all confirmations, QR codes, and payment updates.
              </p>

              <div className={styles.attendeeCard}>
                <div className={styles.attendeeHeader}>
                  <h3><span className={styles.primaryBadge}>Primary</span> Contact</h3>
                </div>

                <div className={styles.formRow3}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      First Name <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      className={`${styles.input} ${primaryErrors.firstName ? styles.inputError : ''}`}
                      value={formData.primaryAttendee.firstName}
                      onChange={(e) => updatePrimaryAttendee('firstName', e.target.value)}
                      placeholder="Juan"
                    />
                    {primaryErrors.firstName && (
                      <span className={styles.errorMessage}>{primaryErrors.firstName}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Middle Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.primaryAttendee.middleName}
                      onChange={(e) => updatePrimaryAttendee('middleName', e.target.value)}
                      placeholder="Santos"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Last Name <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      className={`${styles.input} ${primaryErrors.lastName ? styles.inputError : ''}`}
                      value={formData.primaryAttendee.lastName}
                      onChange={(e) => updatePrimaryAttendee('lastName', e.target.value)}
                      placeholder="Dela Cruz"
                    />
                    {primaryErrors.lastName && (
                      <span className={styles.errorMessage}>{primaryErrors.lastName}</span>
                    )}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Email Address <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="email"
                      className={`${styles.input} ${primaryErrors.email ? styles.inputError : ''}`}
                      value={formData.primaryAttendee.email}
                      onChange={(e) => updatePrimaryAttendee('email', e.target.value)}
                      placeholder="email@example.com"
                    />
                    {primaryErrors.email && (
                      <span className={styles.errorMessage}>{primaryErrors.email}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Confirm Email <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="email"
                      className={`${styles.input} ${primaryErrors.emailConfirm ? styles.inputError : ''}`}
                      value={formData.primaryAttendee.emailConfirm}
                      onChange={(e) => updatePrimaryAttendee('emailConfirm', e.target.value)}
                      placeholder="Re-enter your email"
                    />
                    {primaryErrors.emailConfirm && (
                      <span className={styles.errorMessage}>{primaryErrors.emailConfirm}</span>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Cellphone Number <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="tel"
                    className={`${styles.input} ${primaryErrors.cellphone ? styles.inputError : ''}`}
                    value={formData.primaryAttendee.cellphone}
                    onChange={(e) => updatePrimaryAttendee('cellphone', e.target.value)}
                    placeholder="09XX-XXX-XXXX"
                  />
                  <span className={styles.fieldHint}>Registration code will be sent via SMS</span>
                  {primaryErrors.cellphone && (
                    <span className={styles.errorMessage}>{primaryErrors.cellphone}</span>
                  )}
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Ministry Role <span className={styles.required}>*</span>
                    </label>
                    <select
                      className={`${styles.select} ${primaryErrors.ministryRole ? styles.inputError : ''}`}
                      value={formData.primaryAttendee.ministryRole}
                      onChange={(e) => updatePrimaryAttendee('ministryRole', e.target.value)}
                    >
                      <option value="">Select role</option>
                      {MINISTRY_ROLES.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    {primaryErrors.ministryRole && (
                      <span className={styles.errorMessage}>{primaryErrors.ministryRole}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Category <span className={styles.required}>*</span>
                    </label>
                    <select
                      className={styles.select}
                      value={formData.primaryAttendee.category}
                      onChange={(e) => updatePrimaryAttendee('category', e.target.value)}
                    >
                      {availablePricingTiers.map((tier) => (
                        <option key={tier.id} value={tier.id}>
                          {tier.name} - {formatPrice(tier.regularPrice)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Food Selection for Primary Attendee */}
                {foodSelectionEnabled && foodMenuItems.length > 0 && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Food Preference <span className={styles.required}>*</span>
                    </label>
                    <select
                      className={`${styles.select} ${primaryErrors.foodChoice ? styles.inputError : ''}`}
                      value={formData.primaryAttendee.foodChoice}
                      onChange={(e) => updatePrimaryAttendee('foodChoice', e.target.value)}
                      disabled={loadingFoodMenu}
                    >
                      <option value="">Select food preference</option>
                      {foodMenuItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    {primaryErrors.foodChoice && (
                      <span className={styles.errorMessage}>{primaryErrors.foodChoice}</span>
                    )}
                  </div>
                )}

                {/* Workshop Selection for Primary Attendee */}
                {workshops.length > 0 && (
                  <div className={styles.workshopSection}>
                    <WorkshopSelector
                      workshops={workshops}
                      selections={formData.primaryAttendee.workshopSelections || []}
                      onSelectionChange={updatePrimaryWorkshopSelections}
                      disabled={loadingWorkshops}
                    />
                  </div>
                )}
              </div>

              {/* Additional Attendees Section */}
              <div className={styles.sectionDivider}>
                <span>Additional Attendees ({formData.additionalAttendees?.length || 0})</span>
              </div>
              <p className={styles.sectionHint}>
                Add more attendees from your group. Phone number is required for SMS notification.
                Email is optional but recommended for individual QR code delivery.
              </p>

              {(formData.additionalAttendees || []).map((attendee, index) => (
                <div key={attendee.id} className={styles.attendeeCard}>
                  <div className={styles.attendeeHeader}>
                    <h3>Attendee #{index + 2}</h3>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => removeAdditionalAttendee(index)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className={styles.formRow3}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        First Name <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        className={`${styles.input} ${additionalErrors[index]?.firstName ? styles.inputError : ''}`}
                        value={attendee.firstName}
                        onChange={(e) => updateAdditionalAttendee(index, 'firstName', e.target.value)}
                        placeholder="Juan"
                      />
                      {additionalErrors[index]?.firstName && (
                        <span className={styles.errorMessage}>{additionalErrors[index].firstName}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Middle Name</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={attendee.middleName}
                        onChange={(e) => updateAdditionalAttendee(index, 'middleName', e.target.value)}
                        placeholder="Santos"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Last Name <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        className={`${styles.input} ${additionalErrors[index]?.lastName ? styles.inputError : ''}`}
                        value={attendee.lastName}
                        onChange={(e) => updateAdditionalAttendee(index, 'lastName', e.target.value)}
                        placeholder="Dela Cruz"
                      />
                      {additionalErrors[index]?.lastName && (
                        <span className={styles.errorMessage}>{additionalErrors[index].lastName}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Cellphone Number <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="tel"
                        className={`${styles.input} ${additionalErrors[index]?.cellphone ? styles.inputError : ''}`}
                        value={attendee.cellphone}
                        onChange={(e) => updateAdditionalAttendee(index, 'cellphone', e.target.value)}
                        placeholder="09XX-XXX-XXXX"
                      />
                      <span className={styles.fieldHint}>Required for SMS notification</span>
                      {additionalErrors[index]?.cellphone && (
                        <span className={styles.errorMessage}>{additionalErrors[index].cellphone}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Email Address <span className={styles.optional}>(optional)</span>
                      </label>
                      <input
                        type="email"
                        className={`${styles.input} ${additionalErrors[index]?.email ? styles.inputError : ''}`}
                        value={attendee.email}
                        onChange={(e) => updateAdditionalAttendee(index, 'email', e.target.value)}
                        placeholder="email@example.com"
                      />
                      <span className={styles.fieldHint}>If provided, QR code will be sent here</span>
                      {additionalErrors[index]?.email && (
                        <span className={styles.errorMessage}>{additionalErrors[index].email}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Ministry Role <span className={styles.required}>*</span>
                      </label>
                      <select
                        className={`${styles.select} ${additionalErrors[index]?.ministryRole ? styles.inputError : ''}`}
                        value={attendee.ministryRole}
                        onChange={(e) => updateAdditionalAttendee(index, 'ministryRole', e.target.value)}
                      >
                        <option value="">Select role</option>
                        {MINISTRY_ROLES.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      {additionalErrors[index]?.ministryRole && (
                        <span className={styles.errorMessage}>{additionalErrors[index].ministryRole}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Category <span className={styles.required}>*</span>
                      </label>
                      <select
                        className={styles.select}
                        value={attendee.category}
                        onChange={(e) => updateAdditionalAttendee(index, 'category', e.target.value)}
                      >
                        {availablePricingTiers.map((tier) => (
                          <option key={tier.id} value={tier.id}>
                            {tier.name} - {formatPrice(tier.regularPrice)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Food Selection for Additional Attendee */}
                  {foodSelectionEnabled && foodMenuItems.length > 0 && (
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Food Preference <span className={styles.required}>*</span>
                      </label>
                      <select
                        className={`${styles.select} ${additionalErrors[index]?.foodChoice ? styles.inputError : ''}`}
                        value={attendee.foodChoice}
                        onChange={(e) => updateAdditionalAttendee(index, 'foodChoice', e.target.value)}
                        disabled={loadingFoodMenu}
                      >
                        <option value="">Select food preference</option>
                        {foodMenuItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                      {additionalErrors[index]?.foodChoice && (
                        <span className={styles.errorMessage}>{additionalErrors[index].foodChoice}</span>
                      )}
                    </div>
                  )}

                  {/* Workshop Selection for Additional Attendee */}
                  {workshops.length > 0 && (
                    <div className={styles.workshopSection}>
                      <WorkshopSelector
                        workshops={workshops}
                        selections={attendee.workshopSelections || []}
                        onSelectionChange={(selections) => updateAdditionalWorkshopSelections(index, selections)}
                        disabled={loadingWorkshops}
                      />
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                className={styles.addButton}
                onClick={addAdditionalAttendee}
              >
                + Add Another Attendee
              </button>

              <div className={styles.subtotalBox}>
                <span>Subtotal ({getTotalAttendeeCount()} attendee{getTotalAttendeeCount() > 1 ? 's' : ''})</span>
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
                <h3>Primary Contact</h3>
                <div className={styles.attendeeList}>
                  <div className={styles.attendeeListItem}>
                    <span className={styles.attendeeListName}>
                      <span className={styles.primaryBadgeSmall}>Primary</span>
                      {formData.primaryAttendee.firstName} {formData.primaryAttendee.lastName}
                    </span>
                    <span className={styles.attendeeListCategory}>
                      {getCategoryName(formData.primaryAttendee.category)}
                    </span>
                    <span className={styles.attendeeListPrice}>
                      {formatPrice(getCategoryPrice(formData.primaryAttendee.category))}
                    </span>
                  </div>
                </div>
              </div>

              {formData.additionalAttendees?.length > 0 && (
                <div className={styles.reviewSection}>
                  <h3>Additional Attendees ({formData.additionalAttendees?.length || 0})</h3>
                  <div className={styles.attendeeList}>
                    {(formData.additionalAttendees || []).map((attendee, index) => (
                      <div key={attendee.id} className={styles.attendeeListItem}>
                        <span className={styles.attendeeListName}>
                          {index + 2}. {attendee.firstName} {attendee.lastName}
                        </span>
                        <span className={styles.attendeeListCategory}>
                          {getCategoryName(attendee.category)}
                        </span>
                        <span className={styles.attendeeListPrice}>
                          {formatPrice(getCategoryPrice(attendee.category))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.totalSection}>
                <span>Total Amount ({getTotalAttendeeCount()} attendee{getTotalAttendeeCount() > 1 ? 's' : ''})</span>
                <span className={styles.totalAmount}>{formatPrice(calculateTotalPrice())}</span>
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

          {/* Step 3: Payment Upload */}
          {currentStep === REGISTRATION_STEPS.PAYMENT_UPLOAD && (
            <div className={styles.formStep}>
              <h2>Payment Information</h2>
              <p className={styles.stepDescription}>
                Choose your payment method and provide payment details.
              </p>

              <div className={styles.amountBox}>
                <span>Total Amount to Pay ({getTotalAttendeeCount()} attendee{getTotalAttendeeCount() > 1 ? 's' : ''}):</span>
                <strong>{formatPrice(calculateTotalPrice())}</strong>
              </div>

              <div className={styles.sectionDivider}>
                <span>Select Payment Method</span>
              </div>

              <p className={styles.sectionHint}>
                Choose how you would like to pay for your registration
              </p>

              <div className={styles.paymentMethodGrid}>
                <div
                  className={`${styles.paymentMethodCard} ${
                    formData.paymentMethod === PAYMENT_METHODS.CASH ? styles.selectedPaymentMethod : ''
                  }`}
                  onClick={() => updateField('paymentMethod', PAYMENT_METHODS.CASH)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.paymentMethodIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <h3 className={styles.paymentMethodTitle}>Cash at Registration Booth</h3>
                  <p className={styles.paymentMethodDescription}>
                    Pay in cash when you arrive at the event registration booth
                  </p>
                  {formData.paymentMethod === PAYMENT_METHODS.CASH && (
                    <div className={styles.selectedIndicator}>✓</div>
                  )}
                </div>

                <div
                  className={`${styles.paymentMethodCard} ${
                    formData.paymentMethod === PAYMENT_METHODS.BANK_TRANSFER ? styles.selectedPaymentMethod : ''
                  }`}
                  onClick={() => updateField('paymentMethod', PAYMENT_METHODS.BANK_TRANSFER)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.paymentMethodIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <path d="M12 6V2" />
                      <path d="M6 10h.01" />
                      <path d="M10 10h.01" />
                      <path d="M14 10h.01" />
                      <path d="M18 10h.01" />
                    </svg>
                  </div>
                  <h3 className={styles.paymentMethodTitle}>Online Bank Transfer</h3>
                  <p className={styles.paymentMethodDescription}>
                    Transfer to our bank account and upload your proof of payment
                  </p>
                  {formData.paymentMethod === PAYMENT_METHODS.BANK_TRANSFER && (
                    <div className={styles.selectedIndicator}>✓</div>
                  )}
                </div>

                <div
                  className={`${styles.paymentMethodCard} ${
                    (formData.paymentMethod === PAYMENT_METHODS.GCASH || formData.paymentMethod === PAYMENT_METHODS.PAYMAYA) ? styles.selectedPaymentMethod : ''
                  }`}
                  onClick={() => updateField('paymentMethod', PAYMENT_METHODS.GCASH)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.paymentMethodIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
                  </div>
                  <h3 className={styles.paymentMethodTitle}>E-Wallet (GCash/Maya)</h3>
                  <p className={styles.paymentMethodDescription}>
                    Send payment via GCash or Maya and upload your proof of payment
                  </p>
                  {(formData.paymentMethod === PAYMENT_METHODS.GCASH || formData.paymentMethod === PAYMENT_METHODS.PAYMAYA) && (
                    <div className={styles.selectedIndicator}>✓</div>
                  )}
                </div>
              </div>

              {/* Bank Account Selection - Only for Bank Transfer */}
              {formData.paymentMethod === PAYMENT_METHODS.BANK_TRANSFER && (
                <>
                  <div className={styles.sectionDivider}>
                    <span>Select Bank Account</span>
                  </div>

                  <p className={styles.sectionHint}>
                    Choose the bank account where you will send your payment
                  </p>

              {loadingBankAccounts ? (
                <p>Loading bank accounts...</p>
              ) : (
                <div className={styles.bankAccountGrid}>
                  {bankAccounts
                    .filter((account) =>
                      account.accountType === BANK_ACCOUNT_TYPES.SAVINGS ||
                      account.accountType === BANK_ACCOUNT_TYPES.CHECKING
                    )
                    .map((account) => {
                      const isSelected = formData.selectedBankAccountId === account.id;
                      return (
                        <div
                          key={account.id}
                          className={`${styles.bankAccountCard} ${isSelected ? styles.selectedBank : ''}`}
                          onClick={() => updateField('selectedBankAccountId', account.id)}
                          role="button"
                          tabIndex={0}
                        >
                          <img
                            src={`/images/banks/${account.bankName}.svg`}
                            alt={BANK_LABELS[account.bankName]}
                            className={styles.bankLogo}
                          />
                          <div className={styles.bankAccountDetails}>
                            <h4>{BANK_LABELS[account.bankName]}</h4>
                            <p><strong>Account Name:</strong> {account.accountName}</p>
                            <p><strong>Account No:</strong> {account.accountNumber}</p>
                            {account.branch && <p><strong>Branch:</strong> {account.branch}</p>}
                          </div>
                          {isSelected && (
                            <div className={styles.selectedIndicator}>✓</div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
              {errors.selectedBankAccountId && (
                <span className={styles.errorMessage}>{errors.selectedBankAccountId}</span>
              )}

              <div className={styles.sectionDivider}>
                <span>Upload Payment Receipt</span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="paymentFile" className={styles.label}>
                  Upload Payment Screenshot/Receipt <span className={styles.required}>*</span>
                </label>
                <div className={styles.fileUpload}>
                  <input
                    id="paymentFile"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                    disabled={isOcrProcessing}
                  />
                  <div className={styles.fileUploadButton}>
                    {formData.paymentFileName ? (
                      <span className={styles.fileName}>{formData.paymentFileName}</span>
                    ) : (
                      <span>Click to select file (JPG, PNG, GIF, or WebP)</span>
                    )}
                  </div>
                </div>
                {errors.paymentFile && (
                  <span className={styles.errorMessage}>{errors.paymentFile}</span>
                )}
                <p className={styles.fileHint}>Maximum file size: 5MB</p>
                {isOcrProcessing && (
                  <p className={styles.ocrProcessing}>Processing receipt... Please wait.</p>
                )}
              </div>

              {formData.paymentFile && !isOcrProcessing && (
                <>
                  <div className={styles.sectionDivider}>
                    <span>Payment Details</span>
                  </div>

                  {ocrResult && ocrParsedFields.amount && (
                    <p className={styles.verificationHint}>
                      We&apos;ve auto-filled the details below from your receipt. Please verify they are correct.
                    </p>
                  )}

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="paymentAmount" className={styles.label}>
                        Amount Paid <span className={styles.required}>*</span>
                      </label>
                      <input
                        id="paymentAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        className={`${styles.input} ${errors.paymentAmount ? styles.inputError : ''}`}
                        value={formData.paymentAmount}
                        onChange={(e) => updatePaymentField('paymentAmount', e.target.value)}
                        placeholder="0.00"
                      />
                      {errors.paymentAmount && (
                        <span className={styles.errorMessage}>{errors.paymentAmount}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="paymentDate" className={styles.label}>
                        Payment Date <span className={styles.required}>*</span>
                      </label>
                      <input
                        id="paymentDate"
                        type="date"
                        className={`${styles.input} ${errors.paymentDate ? styles.inputError : ''}`}
                        value={formData.paymentDate}
                        onChange={(e) => updatePaymentField('paymentDate', e.target.value)}
                      />
                      {errors.paymentDate && (
                        <span className={styles.errorMessage}>{errors.paymentDate}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="paymentTime" className={styles.label}>
                        Payment Time <span className={styles.required}>*</span>
                      </label>
                      <input
                        id="paymentTime"
                        type="time"
                        className={`${styles.input} ${errors.paymentTime ? styles.inputError : ''}`}
                        value={formData.paymentTime}
                        onChange={(e) => updatePaymentField('paymentTime', e.target.value)}
                      />
                      {errors.paymentTime && (
                        <span className={styles.errorMessage}>{errors.paymentTime}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="paymentReferenceNumber" className={styles.label}>
                        Reference Number
                      </label>
                      <input
                        id="paymentReferenceNumber"
                        type="text"
                        className={styles.input}
                        value={formData.paymentReferenceNumber}
                        onChange={(e) => updatePaymentField('paymentReferenceNumber', e.target.value)}
                        placeholder="Transaction reference number"
                      />
                    </div>
                  </div>
                </>
              )}
                </>
              )}

              {/* E-Wallet Account Selection - Only for GCash/Maya */}
              {(formData.paymentMethod === PAYMENT_METHODS.GCASH || formData.paymentMethod === PAYMENT_METHODS.PAYMAYA) && (
                <>
                  <div className={styles.sectionDivider}>
                    <span>Select E-Wallet Account</span>
                  </div>

                  <p className={styles.sectionHint}>
                    Choose the GCash or Maya account where you will send your payment
                  </p>

              {loadingBankAccounts ? (
                <p>Loading e-wallet accounts...</p>
              ) : (
                <div className={styles.bankAccountGrid}>
                  {bankAccounts
                    .filter((account) =>
                      account.accountType === BANK_ACCOUNT_TYPES.EWALLET &&
                      (account.bankName === BANK_NAMES.GCASH || account.bankName === BANK_NAMES.MAYA)
                    )
                    .map((account) => {
                      const isSelected = formData.selectedBankAccountId === account.id;
                      return (
                        <div
                          key={account.id}
                          className={`${styles.bankAccountCard} ${isSelected ? styles.selectedBank : ''}`}
                          onClick={() => {
                            updateField('selectedBankAccountId', account.id);
                            // Update payment method to match selected e-wallet
                            if (account.bankName === BANK_NAMES.GCASH) {
                              updateField('paymentMethod', PAYMENT_METHODS.GCASH);
                            } else if (account.bankName === BANK_NAMES.MAYA) {
                              updateField('paymentMethod', PAYMENT_METHODS.PAYMAYA);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <img
                            src={`/images/banks/${account.bankName}.svg`}
                            alt={BANK_LABELS[account.bankName]}
                            className={styles.bankLogo}
                          />
                          <div className={styles.bankAccountDetails}>
                            <h4>{BANK_LABELS[account.bankName]}</h4>
                            <p><strong>Account Name:</strong> {account.accountName}</p>
                            <p><strong>Number:</strong> {account.accountNumber}</p>
                          </div>
                          {isSelected && (
                            <div className={styles.selectedIndicator}>✓</div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
              {errors.selectedBankAccountId && (
                <span className={styles.errorMessage}>{errors.selectedBankAccountId}</span>
              )}

              <div className={styles.sectionDivider}>
                <span>Upload Payment Receipt</span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="paymentFile" className={styles.label}>
                  Upload Payment Screenshot/Receipt <span className={styles.required}>*</span>
                </label>
                <div className={styles.fileUpload}>
                  <input
                    id="paymentFile"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                    disabled={isOcrProcessing}
                  />
                  <div className={styles.fileUploadButton}>
                    {formData.paymentFileName ? (
                      <span className={styles.fileName}>{formData.paymentFileName}</span>
                    ) : (
                      <span>Click to select file (JPG, PNG, GIF, or WebP)</span>
                    )}
                  </div>
                </div>
                {errors.paymentFile && (
                  <span className={styles.errorMessage}>{errors.paymentFile}</span>
                )}
                <p className={styles.fileHint}>Maximum file size: 5MB</p>
                {isOcrProcessing && (
                  <p className={styles.ocrProcessing}>Processing receipt... Please wait.</p>
                )}
              </div>

              {formData.paymentFile && !isOcrProcessing && (
                <>
                  <div className={styles.sectionDivider}>
                    <span>Payment Details</span>
                  </div>

                  {ocrResult && ocrParsedFields.amount && (
                    <p className={styles.verificationHint}>
                      We&apos;ve auto-filled the details below from your receipt. Please verify they are correct.
                    </p>
                  )}

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="paymentAmount" className={styles.label}>
                        Amount Paid <span className={styles.required}>*</span>
                      </label>
                      <input
                        id="paymentAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        className={`${styles.input} ${errors.paymentAmount ? styles.inputError : ''}`}
                        value={formData.paymentAmount}
                        onChange={(e) => updatePaymentField('paymentAmount', e.target.value)}
                        placeholder="0.00"
                      />
                      {errors.paymentAmount && (
                        <span className={styles.errorMessage}>{errors.paymentAmount}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="paymentDate" className={styles.label}>
                        Payment Date <span className={styles.required}>*</span>
                      </label>
                      <input
                        id="paymentDate"
                        type="date"
                        className={`${styles.input} ${errors.paymentDate ? styles.inputError : ''}`}
                        value={formData.paymentDate}
                        onChange={(e) => updatePaymentField('paymentDate', e.target.value)}
                      />
                      {errors.paymentDate && (
                        <span className={styles.errorMessage}>{errors.paymentDate}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="paymentTime" className={styles.label}>
                        Payment Time <span className={styles.required}>*</span>
                      </label>
                      <input
                        id="paymentTime"
                        type="time"
                        className={`${styles.input} ${errors.paymentTime ? styles.inputError : ''}`}
                        value={formData.paymentTime}
                        onChange={(e) => updatePaymentField('paymentTime', e.target.value)}
                      />
                      {errors.paymentTime && (
                        <span className={styles.errorMessage}>{errors.paymentTime}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="paymentReferenceNumber" className={styles.label}>
                        Reference Number
                      </label>
                      <input
                        id="paymentReferenceNumber"
                        type="text"
                        className={styles.input}
                        value={formData.paymentReferenceNumber}
                        onChange={(e) => updatePaymentField('paymentReferenceNumber', e.target.value)}
                        placeholder="Transaction reference number"
                      />
                    </div>
                  </div>
                </>
              )}
                </>
              )}

              {/* Cash Payment Info Message */}
              {formData.paymentMethod === PAYMENT_METHODS.CASH && (
                <div className={styles.cashPaymentInfo}>
                  <p className={styles.cashPaymentMessage}>
                    <strong>Cash Payment at Registration Booth</strong>
                  </p>
                  <p>
                    You have chosen to pay in cash. Please bring the exact amount
                    of <strong>{formatPrice(calculateTotalPrice())}</strong> to the registration booth.
                  </p>
                  <p>
                    <strong>Booth Hours:</strong>
                  </p>
                  <ul>
                    <li>Sunday: During church service (booth available outside the church)</li>
                    <li>Or during the event day at the registration booth</li>
                  </ul>
                  <p className={styles.cashPaymentNote}>
                    Note: Your registration will be confirmed after payment is received at the booth.
                  </p>
                </div>
              )}

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
                <h3>Primary Contact</h3>
                <div className={styles.attendeeSummary}>
                  <div className={styles.attendeeNumber}>
                    <span className={styles.primaryBadge}>Primary</span>
                  </div>
                  <div className={styles.attendeeDetails}>
                    <p className={styles.attendeeName}>
                      {formData.primaryAttendee.lastName}, {formData.primaryAttendee.firstName} {formData.primaryAttendee.middleName}
                    </p>
                    <p>{formData.primaryAttendee.email} | {formData.primaryAttendee.cellphone}</p>
                    <p>{formData.primaryAttendee.ministryRole} | {getCategoryName(formData.primaryAttendee.category)}</p>
                  </div>
                  <div className={styles.attendeePrice}>
                    {formatPrice(getCategoryPrice(formData.primaryAttendee.category))}
                  </div>
                </div>
              </div>

              {formData.additionalAttendees?.length > 0 && (
                <div className={styles.reviewSection}>
                  <h3>Additional Attendees ({formData.additionalAttendees?.length || 0})</h3>
                  {(formData.additionalAttendees || []).map((attendee, index) => (
                    <div key={attendee.id} className={styles.attendeeSummary}>
                      <div className={styles.attendeeNumber}>#{index + 2}</div>
                      <div className={styles.attendeeDetails}>
                        <p className={styles.attendeeName}>
                          {attendee.lastName}, {attendee.firstName} {attendee.middleName}
                        </p>
                        <p>{attendee.email || '(No email)'} | {attendee.cellphone}</p>
                        <p>{attendee.ministryRole} | {getCategoryName(attendee.category)}</p>
                      </div>
                      <div className={styles.attendeePrice}>
                        {formatPrice(getCategoryPrice(attendee.category))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

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

          {/* Error Message */}
          {submitError && (
            <div className={styles.errorBox}>
              <p>{submitError}</p>
              {duplicateRegistration && (
                <p>
                  <a href={`${ROUTES.REGISTRATION_STATUS}?id=${duplicateRegistration.registrationId}`}>
                    Check your existing registration
                  </a>
                </p>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
            <div className={styles.progressBox}>
              <p>Uploading payment proof: {uploadProgress}%</p>
              <div className={styles.progressBarContainer}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${uploadProgress}%` }}
                />
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>
        </div>
      </div>
      </section>
    </div>
  );
}

export default RegisterPage;
