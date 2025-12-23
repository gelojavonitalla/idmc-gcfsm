/**
 * MaintenancePage Component
 * Admin page for IDMC team members to manage seeded content.
 * Provides full CRUD operations for speakers, sessions, workshops, and FAQ.
 *
 * @returns {JSX.Element} The maintenance page component
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context';
import { EditModal } from '../components/maintenance';
import {
  getAllSpeakers,
  saveSpeaker,
  updateSpeaker,
  deleteSpeaker,
  getAllSessions,
  saveSession,
  updateSession,
  deleteSession,
  getAllFAQs,
  saveFAQ,
  updateFAQ,
  deleteFAQ,
} from '../services/maintenance';
import {
  SPEAKER_STATUS,
  SESSION_STATUS,
  FAQ_STATUS,
  SESSION_TYPES,
  SESSION_TYPE_LABELS,
  FAQ_CATEGORIES,
  FAQ_CATEGORY_LABELS,
  WORKSHOP_CATEGORY_LABELS,
  CONFERENCE,
} from '../constants';
import styles from './MaintenancePage.module.css';

/**
 * Tab identifiers for content management sections
 */
const TABS = {
  SPEAKERS: 'speakers',
  SESSIONS: 'sessions',
  FAQ: 'faq',
};

/**
 * Tab labels for display
 */
const TAB_LABELS = {
  [TABS.SPEAKERS]: 'Speakers',
  [TABS.SESSIONS]: 'Sessions & Workshops',
  [TABS.FAQ]: 'FAQ',
};

/**
 * Generates a URL-friendly ID from a string
 *
 * @param {string} str - String to convert to ID
 * @returns {string} URL-friendly ID
 */
function generateId(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50);
}

/**
 * Formats time from 24-hour format to 12-hour format
 *
 * @param {string} time - Time in HH:MM format
 * @returns {string} Formatted time (e.g., "1:15 PM")
 */
function formatTime(time) {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * MaintenancePage Component
 *
 * @returns {JSX.Element} The maintenance page component
 */
function MaintenancePage() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState(TABS.SPEAKERS);
  const [speakers, setSpeakers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Speaker form field definitions
   */
  const speakerFields = useMemo(
    () => [
      { name: 'name', label: 'Name', required: true, placeholder: 'Full name' },
      { name: 'title', label: 'Title', required: true, placeholder: 'Job title or role' },
      { name: 'organization', label: 'Organization', required: true, placeholder: 'Company or church name' },
      {
        name: 'sessionType',
        label: 'Session Type',
        type: 'select',
        required: true,
        options: Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
        defaultValue: SESSION_TYPES.WORKSHOP,
      },
      { name: 'sessionTitle', label: 'Session Title', placeholder: 'Title of the session they will speak at' },
      { name: 'bio', label: 'Biography', type: 'textarea', rows: 5, placeholder: 'Speaker biography' },
      { name: 'photoUrl', label: 'Photo URL', placeholder: 'URL to speaker photo (optional)' },
      { name: 'order', label: 'Display Order', type: 'number', min: 1, defaultValue: 1 },
      { name: 'featured', label: 'Featured Speaker', type: 'checkbox', checkboxLabel: 'Show on homepage' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: SPEAKER_STATUS.PUBLISHED, label: 'Published' },
          { value: SPEAKER_STATUS.DRAFT, label: 'Draft' },
        ],
        defaultValue: SPEAKER_STATUS.DRAFT,
      },
    ],
    []
  );

  /**
   * Session form field definitions
   */
  const sessionFields = useMemo(
    () => [
      { name: 'title', label: 'Title', required: true, placeholder: 'Session title' },
      { name: 'description', label: 'Description', type: 'textarea', rows: 3, placeholder: 'Session description' },
      {
        name: 'sessionType',
        label: 'Session Type',
        type: 'select',
        required: true,
        options: Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
        defaultValue: SESSION_TYPES.PLENARY,
      },
      {
        name: 'category',
        label: 'Workshop Category',
        type: 'select',
        options: [
          { value: '', label: 'N/A (not a workshop)' },
          ...Object.entries(WORKSHOP_CATEGORY_LABELS).map(([value, label]) => ({
            value,
            label,
          })),
        ],
        hint: 'Only applies to workshop sessions',
      },
      { name: 'time', label: 'Start Time', required: true, placeholder: '9:00 AM' },
      { name: 'endTime', label: 'End Time', required: true, placeholder: '10:00 AM' },
      { name: 'venue', label: 'Venue', required: true, placeholder: 'Location name' },
      { name: 'speakerNames', label: 'Speaker Names', placeholder: 'Comma-separated speaker names' },
      { name: 'capacity', label: 'Capacity', type: 'number', min: 0, placeholder: 'Leave empty for unlimited' },
      { name: 'order', label: 'Display Order', type: 'number', min: 1, defaultValue: 1 },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: SESSION_STATUS.PUBLISHED, label: 'Published' },
          { value: SESSION_STATUS.DRAFT, label: 'Draft' },
        ],
        defaultValue: SESSION_STATUS.DRAFT,
      },
    ],
    []
  );

  /**
   * FAQ form field definitions
   */
  const faqFields = useMemo(
    () => [
      { name: 'question', label: 'Question', required: true, placeholder: 'Enter the FAQ question' },
      { name: 'answer', label: 'Answer', type: 'textarea', required: true, rows: 5, placeholder: 'Enter the answer' },
      {
        name: 'category',
        label: 'Category',
        type: 'select',
        required: true,
        options: Object.entries(FAQ_CATEGORY_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
        defaultValue: FAQ_CATEGORIES.GENERAL,
      },
      { name: 'order', label: 'Display Order', type: 'number', min: 1, defaultValue: 1 },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: FAQ_STATUS.PUBLISHED, label: 'Published' },
          { value: FAQ_STATUS.DRAFT, label: 'Draft' },
        ],
        defaultValue: FAQ_STATUS.DRAFT,
      },
    ],
    []
  );

  /**
   * Fetches all data on component mount
   */
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const [speakersData, sessionsData, faqsData] = await Promise.all([
          getAllSpeakers(),
          getAllSessions(),
          getAllFAQs(),
        ]);

        setSpeakers(speakersData);
        setSessions(sessionsData);
        setFaqs(faqsData);
      } catch (fetchError) {
        console.error('Failed to fetch maintenance data:', fetchError);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  /**
   * Opens the add modal for the current tab
   */
  const handleAdd = useCallback(() => {
    setModalMode('add');
    setEditingItem(null);
    setModalOpen(true);
  }, []);

  /**
   * Opens the edit modal for an item
   *
   * @param {Object} item - Item to edit
   */
  const handleEdit = useCallback((item) => {
    setModalMode('edit');
    setEditingItem(item);
    setModalOpen(true);
  }, []);

  /**
   * Closes the modal
   */
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingItem(null);
    setIsSaving(false);
  }, []);

  /**
   * Saves a speaker (create or update)
   *
   * @param {Object} formData - Speaker form data
   */
  const handleSaveSpeaker = useCallback(
    async (formData) => {
      setIsSaving(true);
      setError(null);

      try {
        const speakerData = {
          ...formData,
          order: parseInt(formData.order, 10) || 1,
          featured: Boolean(formData.featured),
        };

        const speakerId = editingItem?.id || generateId(formData.name);

        await saveSpeaker(speakerId, speakerData);

        if (modalMode === 'add') {
          setSpeakers((prev) => [...prev, { id: speakerId, ...speakerData }]);
        } else {
          setSpeakers((prev) =>
            prev.map((s) => (s.id === speakerId ? { ...s, ...speakerData } : s))
          );
        }

        handleCloseModal();
      } catch (saveError) {
        console.error('Failed to save speaker:', saveError);
        setError('Failed to save speaker. Please try again.');
      } finally {
        setIsSaving(false);
      }
    },
    [editingItem, modalMode, handleCloseModal]
  );

  /**
   * Saves a session (create or update)
   *
   * @param {Object} formData - Session form data
   */
  const handleSaveSession = useCallback(
    async (formData) => {
      setIsSaving(true);
      setError(null);

      try {
        const speakerNamesArray = formData.speakerNames
          ? formData.speakerNames.split(',').map((name) => name.trim()).filter(Boolean)
          : [];

        const sessionData = {
          ...formData,
          order: parseInt(formData.order, 10) || 1,
          capacity: formData.capacity ? parseInt(formData.capacity, 10) : null,
          speakerNames: speakerNamesArray,
          registeredCount: editingItem?.registeredCount || 0,
        };

        if (!sessionData.category) {
          delete sessionData.category;
        }

        const sessionId = editingItem?.id || generateId(formData.title);

        await saveSession(sessionId, sessionData);

        if (modalMode === 'add') {
          setSessions((prev) => [...prev, { id: sessionId, ...sessionData }]);
        } else {
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, ...sessionData } : s))
          );
        }

        handleCloseModal();
      } catch (saveError) {
        console.error('Failed to save session:', saveError);
        setError('Failed to save session. Please try again.');
      } finally {
        setIsSaving(false);
      }
    },
    [editingItem, modalMode, handleCloseModal]
  );

  /**
   * Saves an FAQ (create or update)
   *
   * @param {Object} formData - FAQ form data
   */
  const handleSaveFAQ = useCallback(
    async (formData) => {
      setIsSaving(true);
      setError(null);

      try {
        const faqData = {
          ...formData,
          order: parseInt(formData.order, 10) || 1,
        };

        const faqId = editingItem?.id || `faq-${formData.category}-${Date.now()}`;

        await saveFAQ(faqId, faqData);

        if (modalMode === 'add') {
          setFaqs((prev) => [...prev, { id: faqId, ...faqData }]);
        } else {
          setFaqs((prev) =>
            prev.map((f) => (f.id === faqId ? { ...f, ...faqData } : f))
          );
        }

        handleCloseModal();
      } catch (saveError) {
        console.error('Failed to save FAQ:', saveError);
        setError('Failed to save FAQ. Please try again.');
      } finally {
        setIsSaving(false);
      }
    },
    [editingItem, modalMode, handleCloseModal]
  );

  /**
   * Handles modal save based on active tab
   *
   * @param {Object} formData - Form data from modal
   */
  const handleModalSave = useCallback(
    (formData) => {
      switch (activeTab) {
        case TABS.SPEAKERS:
          return handleSaveSpeaker(formData);
        case TABS.SESSIONS:
          return handleSaveSession(formData);
        case TABS.FAQ:
          return handleSaveFAQ(formData);
        default:
          return null;
      }
    },
    [activeTab, handleSaveSpeaker, handleSaveSession, handleSaveFAQ]
  );

  /**
   * Toggles speaker status between published and draft
   *
   * @param {Object} speaker - Speaker object to toggle
   */
  const handleToggleSpeakerStatus = useCallback(async (speaker) => {
    const newStatus =
      speaker.status === SPEAKER_STATUS.PUBLISHED
        ? SPEAKER_STATUS.DRAFT
        : SPEAKER_STATUS.PUBLISHED;

    setActionInProgress(`speaker-${speaker.id}`);

    try {
      await updateSpeaker(speaker.id, { status: newStatus });
      setSpeakers((prev) =>
        prev.map((s) => (s.id === speaker.id ? { ...s, status: newStatus } : s))
      );
    } catch (updateError) {
      console.error('Failed to update speaker status:', updateError);
      setError('Failed to update speaker. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  }, []);

  /**
   * Deletes a speaker
   *
   * @param {Object} speaker - Speaker object to delete
   */
  const handleDeleteSpeaker = useCallback(async (speaker) => {
    if (!window.confirm(`Are you sure you want to delete ${speaker.name}?`)) {
      return;
    }

    setActionInProgress(`speaker-delete-${speaker.id}`);

    try {
      await deleteSpeaker(speaker.id);
      setSpeakers((prev) => prev.filter((s) => s.id !== speaker.id));
    } catch (deleteError) {
      console.error('Failed to delete speaker:', deleteError);
      setError('Failed to delete speaker. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  }, []);

  /**
   * Toggles session status between published and draft
   *
   * @param {Object} session - Session object to toggle
   */
  const handleToggleSessionStatus = useCallback(async (session) => {
    const newStatus =
      session.status === SESSION_STATUS.PUBLISHED
        ? SESSION_STATUS.DRAFT
        : SESSION_STATUS.PUBLISHED;

    setActionInProgress(`session-${session.id}`);

    try {
      await updateSession(session.id, { status: newStatus });
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, status: newStatus } : s))
      );
    } catch (updateError) {
      console.error('Failed to update session status:', updateError);
      setError('Failed to update session. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  }, []);

  /**
   * Deletes a session
   *
   * @param {Object} session - Session object to delete
   */
  const handleDeleteSession = useCallback(async (session) => {
    if (!window.confirm(`Are you sure you want to delete "${session.title}"?`)) {
      return;
    }

    setActionInProgress(`session-delete-${session.id}`);

    try {
      await deleteSession(session.id);
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
    } catch (deleteError) {
      console.error('Failed to delete session:', deleteError);
      setError('Failed to delete session. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  }, []);

  /**
   * Toggles FAQ status between published and draft
   *
   * @param {Object} faq - FAQ object to toggle
   */
  const handleToggleFAQStatus = useCallback(async (faq) => {
    const newStatus =
      faq.status === FAQ_STATUS.PUBLISHED
        ? FAQ_STATUS.DRAFT
        : FAQ_STATUS.PUBLISHED;

    setActionInProgress(`faq-${faq.id}`);

    try {
      await updateFAQ(faq.id, { status: newStatus });
      setFaqs((prev) =>
        prev.map((f) => (f.id === faq.id ? { ...f, status: newStatus } : f))
      );
    } catch (updateError) {
      console.error('Failed to update FAQ status:', updateError);
      setError('Failed to update FAQ. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  }, []);

  /**
   * Deletes an FAQ
   *
   * @param {Object} faq - FAQ object to delete
   */
  const handleDeleteFAQ = useCallback(async (faq) => {
    if (!window.confirm(`Are you sure you want to delete this FAQ?`)) {
      return;
    }

    setActionInProgress(`faq-delete-${faq.id}`);

    try {
      await deleteFAQ(faq.id);
      setFaqs((prev) => prev.filter((f) => f.id !== faq.id));
    } catch (deleteError) {
      console.error('Failed to delete FAQ:', deleteError);
      setError('Failed to delete FAQ. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  }, []);

  /**
   * Gets the current modal configuration based on active tab
   *
   * @returns {Object} Modal configuration
   */
  const getModalConfig = useCallback(() => {
    const isEditing = modalMode === 'edit';

    switch (activeTab) {
      case TABS.SPEAKERS:
        return {
          title: isEditing ? 'Edit Speaker' : 'Add Speaker',
          fields: speakerFields,
          initialData: editingItem,
        };
      case TABS.SESSIONS:
        return {
          title: isEditing ? 'Edit Session' : 'Add Session',
          fields: sessionFields,
          initialData: editingItem
            ? {
                ...editingItem,
                speakerNames: Array.isArray(editingItem.speakerNames)
                  ? editingItem.speakerNames.join(', ')
                  : editingItem.speakerNames,
              }
            : null,
        };
      case TABS.FAQ:
        return {
          title: isEditing ? 'Edit FAQ' : 'Add FAQ',
          fields: faqFields,
          initialData: editingItem,
        };
      default:
        return { title: '', fields: [], initialData: null };
    }
  }, [activeTab, modalMode, editingItem, speakerFields, sessionFields, faqFields]);

  /**
   * Renders the speakers management section
   *
   * @returns {JSX.Element} Speakers table
   */
  const renderSpeakers = () => (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Order</th>
            <th>Name</th>
            <th>Title</th>
            <th>Organization</th>
            <th>Session Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {speakers.length === 0 ? (
            <tr>
              <td colSpan="7" className={styles.emptyRow}>
                No speakers found. Click "Add Speaker" to create one.
              </td>
            </tr>
          ) : (
            speakers.map((speaker) => (
              <tr key={speaker.id}>
                <td>{speaker.order}</td>
                <td className={styles.nameCell}>{speaker.name}</td>
                <td>{speaker.title}</td>
                <td>{speaker.organization}</td>
                <td>{SESSION_TYPE_LABELS[speaker.sessionType] || speaker.sessionType}</td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${
                      speaker.status === SPEAKER_STATUS.PUBLISHED
                        ? styles.statusPublished
                        : styles.statusDraft
                    }`}
                  >
                    {speaker.status}
                  </span>
                </td>
                <td className={styles.actionsCell}>
                  <button
                    className={`${styles.actionButton} ${styles.editButton}`}
                    onClick={() => handleEdit(speaker)}
                  >
                    Edit
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={() => handleToggleSpeakerStatus(speaker)}
                    disabled={actionInProgress === `speaker-${speaker.id}`}
                  >
                    {speaker.status === SPEAKER_STATUS.PUBLISHED
                      ? 'Unpublish'
                      : 'Publish'}
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => handleDeleteSpeaker(speaker)}
                    disabled={actionInProgress === `speaker-delete-${speaker.id}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  /**
   * Renders the sessions management section
   *
   * @returns {JSX.Element} Sessions table
   */
  const renderSessions = () => (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Order</th>
            <th>Title</th>
            <th>Time</th>
            <th>Type</th>
            <th>Venue</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 ? (
            <tr>
              <td colSpan="7" className={styles.emptyRow}>
                No sessions found. Click "Add Session" to create one.
              </td>
            </tr>
          ) : (
            sessions.map((session) => (
              <tr key={session.id}>
                <td>{session.order}</td>
                <td className={styles.nameCell}>{session.title}</td>
                <td>
                  {formatTime(session.startTime)} - {formatTime(session.endTime)}
                </td>
                <td>{SESSION_TYPE_LABELS[session.sessionType] || session.sessionType}</td>
                <td>{session.venue}</td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${
                      session.status === SESSION_STATUS.PUBLISHED
                        ? styles.statusPublished
                        : styles.statusDraft
                    }`}
                  >
                    {session.status || 'published'}
                  </span>
                </td>
                <td className={styles.actionsCell}>
                  <button
                    className={`${styles.actionButton} ${styles.editButton}`}
                    onClick={() => handleEdit(session)}
                  >
                    Edit
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={() => handleToggleSessionStatus(session)}
                    disabled={actionInProgress === `session-${session.id}`}
                  >
                    {session.status === SESSION_STATUS.PUBLISHED
                      ? 'Unpublish'
                      : 'Publish'}
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => handleDeleteSession(session)}
                    disabled={actionInProgress === `session-delete-${session.id}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  /**
   * Renders the FAQ management section
   *
   * @returns {JSX.Element} FAQ table
   */
  const renderFAQs = () => (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Order</th>
            <th>Question</th>
            <th>Category</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {faqs.length === 0 ? (
            <tr>
              <td colSpan="5" className={styles.emptyRow}>
                No FAQs found. Click "Add FAQ" to create one.
              </td>
            </tr>
          ) : (
            faqs.map((faq) => (
              <tr key={faq.id}>
                <td>{faq.order}</td>
                <td className={styles.questionCell}>{faq.question}</td>
                <td>{FAQ_CATEGORY_LABELS[faq.category] || faq.category}</td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${
                      faq.status === FAQ_STATUS.PUBLISHED
                        ? styles.statusPublished
                        : styles.statusDraft
                    }`}
                  >
                    {faq.status}
                  </span>
                </td>
                <td className={styles.actionsCell}>
                  <button
                    className={`${styles.actionButton} ${styles.editButton}`}
                    onClick={() => handleEdit(faq)}
                  >
                    Edit
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={() => handleToggleFAQStatus(faq)}
                    disabled={actionInProgress === `faq-${faq.id}`}
                  >
                    {faq.status === FAQ_STATUS.PUBLISHED ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => handleDeleteFAQ(faq)}
                    disabled={actionInProgress === `faq-delete-${faq.id}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  /**
   * Renders the content based on active tab
   *
   * @returns {JSX.Element} Tab content
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case TABS.SPEAKERS:
        return renderSpeakers();
      case TABS.SESSIONS:
        return renderSessions();
      case TABS.FAQ:
        return renderFAQs();
      default:
        return null;
    }
  };

  /**
   * Gets the add button label based on active tab
   *
   * @returns {string} Button label
   */
  const getAddButtonLabel = () => {
    switch (activeTab) {
      case TABS.SPEAKERS:
        return 'Add Speaker';
      case TABS.SESSIONS:
        return 'Add Session';
      case TABS.FAQ:
        return 'Add FAQ';
      default:
        return 'Add';
    }
  };

  const modalConfig = getModalConfig();

  return (
    <div className={styles.page}>
      {/* Header Section */}
      <section className={styles.headerSection}>
        <div className="container">
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.title}>Content Maintenance</h1>
              <p className={styles.subtitle}>
                IDMC {CONFERENCE.YEAR} - Manage speakers, sessions, and FAQ
              </p>
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userEmail}>{user?.email}</span>
              <span className={styles.userRole}>{user?.roleLabel}</span>
              <button className={styles.signOutButton} onClick={signOut}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.contentSection}>
        <div className="container">
          {/* Error Banner */}
          {error && (
            <div className={styles.errorBanner} role="alert">
              {error}
              <button
                className={styles.dismissButton}
                onClick={() => setError(null)}
                aria-label="Dismiss error"
              >
                &times;
              </button>
            </div>
          )}

          {/* Tabs and Add Button */}
          <div className={styles.tabsHeader}>
            <div className={styles.tabs}>
              {Object.entries(TAB_LABELS).map(([tabKey, tabLabel]) => (
                <button
                  key={tabKey}
                  className={`${styles.tab} ${
                    activeTab === tabKey ? styles.tabActive : ''
                  }`}
                  onClick={() => setActiveTab(tabKey)}
                >
                  {tabLabel}
                  <span className={styles.tabCount}>
                    {tabKey === TABS.SPEAKERS && speakers.length}
                    {tabKey === TABS.SESSIONS && sessions.length}
                    {tabKey === TABS.FAQ && faqs.length}
                  </span>
                </button>
              ))}
            </div>
            <button className={styles.addButton} onClick={handleAdd}>
              + {getAddButtonLabel()}
            </button>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {isLoading ? (
              <div className={styles.loadingState}>
                <p>Loading content...</p>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </section>

      {/* Edit/Add Modal */}
      <EditModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSave={handleModalSave}
        title={modalConfig.title}
        fields={modalConfig.fields}
        initialData={modalConfig.initialData}
        isLoading={isSaving}
      />
    </div>
  );
}

export default MaintenancePage;
