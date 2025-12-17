# Code Deduplication Plan

> **Document Version:** 1.0
> **Last Updated:** December 2024
> **Status:** Planning Phase

## Executive Summary

This document outlines a comprehensive plan to reduce code duplication across the IDMC-GCFSM codebase. Based on thorough analysis, we have identified **8 major duplication categories** affecting **20+ files** with an estimated reduction of **1000+ lines** of redundant code.

### Key Benefits
- **Maintainability:** Single source of truth for common patterns
- **Consistency:** Standardized behavior across components
- **Reduced Bugs:** Fix once, apply everywhere
- **Developer Experience:** Less boilerplate when creating new features

---

## Table of Contents

1. [Priority Matrix](#priority-matrix)
2. [High Priority Deduplication](#high-priority-deduplication)
   - [Modal Component Boilerplate](#1-modal-component-boilerplate)
   - [Service Layer Firestore Queries](#2-service-layer-firestore-queries)
3. [Medium Priority Deduplication](#medium-priority-deduplication)
   - [Admin Page CRUD Patterns](#3-admin-page-crud-patterns)
   - [Utility Function Consolidation](#4-utility-function-consolidation)
   - [Service CRUD Operations](#5-service-crud-operations)
4. [Low Priority Deduplication](#low-priority-deduplication)
   - [Time Formatting Utilities](#6-time-formatting-utilities)
   - [Table Component Empty States](#7-table-component-empty-states)
   - [Form Field Components](#8-form-field-components)
5. [Implementation Phases](#implementation-phases)
6. [File Structure Changes](#file-structure-changes)
7. [Testing Strategy](#testing-strategy)

---

## Priority Matrix

| Priority | Category | Files Affected | Est. Lines Saved | Effort | Risk |
|----------|----------|----------------|------------------|--------|------|
| **HIGH** | Modal Boilerplate | 4 modals | 200+ | Medium | Low |
| **HIGH** | Service Query Duplication | 4 services | 150+ | Medium | Low |
| **MEDIUM** | Admin Page Patterns | 5+ pages | 400+ | Medium | Low |
| **MEDIUM** | CRUD Service Patterns | 3+ services | 100+ | Low | Low |
| **MEDIUM** | Slug Generation | 4+ places | 20+ | Low | Low |
| **LOW** | Time Formatting | 2+ places | 8+ | Low | Low |
| **LOW** | Table Empty States | 5+ tables | 100+ | Low | Low |
| **LOW** | Form Field Components | Multiple | 50+ | Medium | Low |

**Total Estimated Code Reduction: 1000+ lines**

---

## High Priority Deduplication

### 1. Modal Component Boilerplate

#### Current State

**Files Affected:**
- `src/components/admin/SessionFormModal.js` (490 lines)
- `src/components/admin/SpeakerFormModal.js` (512 lines)
- `src/components/admin/FAQFormModal.js` (352 lines)
- `src/components/admin/DownloadFormModal.js` (857 lines)

#### Duplicated Patterns

**Pattern A: Click Outside Detection**
```javascript
// Repeated in all 4 modal files
useEffect(() => {
  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };
  if (isOpen) {
    document.addEventListener('mousedown', handleClickOutside);
    document.body.style.overflow = 'hidden';
  }
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
    document.body.style.overflow = '';
  };
}, [isOpen, onClose]);
```

**Pattern B: Escape Key Handling**
```javascript
// Repeated in all 4 modal files
useEffect(() => {
  const handleEscape = (event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };
  if (isOpen) {
    document.addEventListener('keydown', handleEscape);
  }
  return () => {
    document.removeEventListener('keydown', handleEscape);
  };
}, [isOpen, onClose]);
```

**Pattern C: Modal Header Structure**
```javascript
// Nearly identical across all modals
<div className={styles.modalHeader}>
  <h2 className={styles.title}>{isEditing ? 'Edit Item' : 'Add New Item'}</h2>
  <button onClick={onClose} className={styles.closeButton}>
    <svg>...</svg>
  </button>
</div>
```

#### Proposed Solution

Create `src/components/admin/BaseFormModal.js`:

```javascript
/**
 * BaseFormModal - Reusable modal wrapper for admin forms
 *
 * @description Provides standard modal behavior including:
 * - Click outside to close
 * - Escape key to close
 * - Body scroll lock
 * - Consistent header/footer styling
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Close handler
 * @param {string} props.title - Modal title
 * @param {boolean} props.isEditing - Whether editing existing item
 * @param {React.ReactNode} props.children - Form content
 * @param {Function} props.onSubmit - Form submit handler
 * @param {boolean} props.isSubmitting - Loading state
 * @param {string} props.error - Error message to display
 */
import { useEffect, useRef, useCallback } from 'react';
import styles from './BaseFormModal.module.css';

export function BaseFormModal({
  isOpen,
  onClose,
  title,
  isEditing = false,
  children,
  onSubmit,
  isSubmitting = false,
  error = null,
  submitLabel = 'Save',
}) {
  const modalRef = useRef(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div ref={modalRef} className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEditing ? `Edit ${title}` : `Add New ${title}`}
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            <svg /* close icon */ />
          </button>
        </div>

        <form onSubmit={onSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.content}>
            {children}
          </div>

          <div className={styles.footer}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
              {isSubmitting ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

#### Refactored Usage Example

```javascript
// SessionFormModal.js - After refactoring
import { BaseFormModal } from './BaseFormModal';

export function SessionFormModal({ isOpen, onClose, session, onSave }) {
  const [formData, setFormData] = useState(/* ... */);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Form submission logic only
  };

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Session"
      isEditing={!!session}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
    >
      {/* Form fields only - no boilerplate */}
      <FormField label="Title" value={formData.title} onChange={...} />
      <FormField label="Description" value={formData.description} onChange={...} />
    </BaseFormModal>
  );
}
```

#### Estimated Impact
- **Lines Saved:** 200+ lines
- **Files Modified:** 4 modal components
- **New Files:** 1 (`BaseFormModal.js` + CSS module)

---

### 2. Service Layer Firestore Queries

#### Current State

**Files Affected:**
- `src/services/speakers.js`
- `src/services/sessions.js`
- `src/services/faq.js`
- `src/services/workshops.js`
- `src/services/downloads.js`

#### Duplicated Patterns

**Pattern A: Get Published Items**
```javascript
// speakers.js
export async function getPublishedSpeakers() {
  const speakersRef = collection(db, COLLECTIONS.SPEAKERS);
  const publishedQuery = query(
    speakersRef,
    where('status', '==', SPEAKER_STATUS.PUBLISHED),
    orderBy('order', 'asc')
  );
  const snapshot = await getDocs(publishedQuery);
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

// sessions.js - IDENTICAL PATTERN
export async function getPublishedSessions() {
  const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
  const publishedQuery = query(
    sessionsRef,
    where('status', '==', SESSION_STATUS.PUBLISHED),
    orderBy('order', 'asc')
  );
  const snapshot = await getDocs(publishedQuery);
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}
```

**Pattern B: Get Document by ID**
```javascript
// Identical in all services
export async function getItemById(itemId) {
  if (!itemId) return null;

  const itemRef = doc(db, COLLECTIONS.COLLECTION_NAME, itemId);
  const snapshot = await getDoc(itemRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}
```

**Pattern C: Document Mapping**
```javascript
// Repeated everywhere
snapshot.docs.map((docSnapshot) => ({
  id: docSnapshot.id,
  ...docSnapshot.data(),
}))
```

#### Proposed Solution

Create `src/lib/firestoreQueries.js`:

```javascript
/**
 * Firestore Query Helpers
 *
 * @description Reusable functions for common Firestore operations
 * to reduce code duplication across service files.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Maps Firestore document snapshots to objects with id
 * @param {QuerySnapshot} snapshot - Firestore query snapshot
 * @returns {Array<Object>} Array of documents with id field
 */
export function mapDocsWithId(snapshot) {
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

/**
 * Gets a single document by ID
 * @param {string} collectionName - Firestore collection name
 * @param {string} docId - Document ID
 * @returns {Promise<Object|null>} Document data with id, or null
 */
export async function getDocById(collectionName, docId) {
  if (!docId) return null;

  const docRef = doc(db, collectionName, docId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

/**
 * Gets all published items from a collection
 * @param {string} collectionName - Firestore collection name
 * @param {string} publishedStatus - Status value for published items
 * @param {string} orderField - Field to order by (default: 'order')
 * @param {string} orderDirection - Order direction (default: 'asc')
 * @returns {Promise<Array<Object>>} Array of published items
 */
export async function getPublishedItems(
  collectionName,
  publishedStatus,
  orderField = 'order',
  orderDirection = 'asc'
) {
  const collRef = collection(db, collectionName);
  const publishedQuery = query(
    collRef,
    where('status', '==', publishedStatus),
    orderBy(orderField, orderDirection)
  );
  const snapshot = await getDocs(publishedQuery);
  return mapDocsWithId(snapshot);
}

/**
 * Gets all items from a collection with optional ordering
 * @param {string} collectionName - Firestore collection name
 * @param {string} orderField - Field to order by
 * @param {string} orderDirection - Order direction
 * @returns {Promise<Array<Object>>} Array of all items
 */
export async function getAllItems(
  collectionName,
  orderField = 'order',
  orderDirection = 'asc'
) {
  const collRef = collection(db, collectionName);
  const orderedQuery = query(
    collRef,
    orderBy(orderField, orderDirection)
  );
  const snapshot = await getDocs(orderedQuery);
  return mapDocsWithId(snapshot);
}
```

#### Refactored Usage Example

```javascript
// speakers.js - After refactoring
import { COLLECTIONS, SPEAKER_STATUS } from '@/constants';
import { getPublishedItems, getDocById, getAllItems } from '@/lib/firestoreQueries';

export async function getPublishedSpeakers() {
  return getPublishedItems(COLLECTIONS.SPEAKERS, SPEAKER_STATUS.PUBLISHED);
}

export async function getSpeakerById(speakerId) {
  return getDocById(COLLECTIONS.SPEAKERS, speakerId);
}

export async function getAllSpeakers() {
  return getAllItems(COLLECTIONS.SPEAKERS);
}
```

#### Estimated Impact
- **Lines Saved:** 150+ lines
- **Files Modified:** 5 service files
- **New Files:** 1 (`firestoreQueries.js`)

---

## Medium Priority Deduplication

### 3. Admin Page CRUD Patterns

#### Current State

**Files Affected:**
- `src/pages/admin/AdminSpeakersPage.js`
- `src/pages/admin/AdminSchedulePage.js`
- `src/pages/admin/AdminFAQPage.js`
- `src/pages/admin/AdminDownloadsPage.js`
- `src/pages/admin/AdminRegistrationsPage.js`

#### Duplicated Pattern

```javascript
// Identical in all admin CRUD pages
const [items, setItems] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingItem, setEditingItem] = useState(null);

const fetchItems = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  try {
    const data = await getAllItems();
    setItems(data);
  } catch (fetchError) {
    console.error('Failed to fetch items:', fetchError);
    setError('Failed to load items. Please try again.');
  } finally {
    setIsLoading(false);
  }
}, []);

useEffect(() => {
  fetchItems();
}, [fetchItems]);

const handleAdd = () => {
  setEditingItem(null);
  setIsModalOpen(true);
};

const handleEdit = (item) => {
  setEditingItem(item);
  setIsModalOpen(true);
};

const handleCloseModal = () => {
  setEditingItem(null);
  setIsModalOpen(false);
};

const handleSave = async () => {
  await fetchItems();
  handleCloseModal();
};
```

#### Proposed Solution

Create `src/hooks/useAdminCrudPage.js`:

```javascript
/**
 * useAdminCrudPage - Custom hook for admin CRUD page state management
 *
 * @description Provides common state and handlers for admin pages
 * that manage lists of items with add/edit modals.
 *
 * @param {Function} fetchFunction - Async function to fetch items
 * @param {string} itemName - Name of item type for error messages
 * @returns {Object} State and handlers for CRUD operations
 */
import { useState, useCallback, useEffect } from 'react';

export function useAdminCrudPage(fetchFunction, itemName = 'items') {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchFunction();
      setItems(data);
    } catch (fetchError) {
      console.error(`Failed to fetch ${itemName}:`, fetchError);
      setError(`Failed to load ${itemName}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, itemName]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAdd = useCallback(() => {
    setEditingItem(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setEditingItem(null);
    setIsModalOpen(false);
  }, []);

  const handleSave = useCallback(async () => {
    await fetchItems();
    handleCloseModal();
  }, [fetchItems, handleCloseModal]);

  return {
    // State
    items,
    isLoading,
    error,
    isModalOpen,
    editingItem,
    // Handlers
    handleAdd,
    handleEdit,
    handleCloseModal,
    handleSave,
    refetch: fetchItems,
  };
}
```

#### Refactored Usage Example

```javascript
// AdminSpeakersPage.js - After refactoring
import { useAdminCrudPage } from '@/hooks/useAdminCrudPage';
import { getAllSpeakers } from '@/services/speakers';

export function AdminSpeakersPage() {
  const {
    items: speakers,
    isLoading,
    error,
    isModalOpen,
    editingItem,
    handleAdd,
    handleEdit,
    handleCloseModal,
    handleSave,
  } = useAdminCrudPage(getAllSpeakers, 'speakers');

  return (
    <AdminLayout title="Speakers">
      <PageHeader onAdd={handleAdd} />

      {error && <ErrorAlert message={error} />}

      <SpeakerTable
        speakers={speakers}
        isLoading={isLoading}
        onEdit={handleEdit}
      />

      <SpeakerFormModal
        isOpen={isModalOpen}
        speaker={editingItem}
        onClose={handleCloseModal}
        onSave={handleSave}
      />
    </AdminLayout>
  );
}
```

#### Estimated Impact
- **Lines Saved:** 400+ lines (80 per page × 5 pages)
- **Files Modified:** 5 admin pages
- **New Files:** 1 (`useAdminCrudPage.js`)

---

### 4. Utility Function Consolidation

#### Current State: Slug Generation

**Files Affected:**
- `src/components/admin/SessionFormModal.js` (lines 139-146)
- `src/components/admin/SpeakerFormModal.js` (lines 196-203)
- `src/components/admin/FAQFormModal.js` (lines 125-133)
- `src/components/admin/DownloadFormModal.js` (lines 169-176)

#### Duplicated Pattern

```javascript
// Identical in 4+ files
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};
```

#### Proposed Solution

Add to `src/utils/index.js`:

```javascript
/**
 * Generates a URL-safe slug from text
 *
 * @param {string} text - Text to convert to slug
 * @param {string} prefix - Optional prefix for the slug
 * @returns {string} URL-safe slug
 *
 * @example
 * generateSlug('Hello World!') // 'hello-world'
 * generateSlug('Test Title', 'session') // 'session-test-title'
 */
export function generateSlug(text, prefix = '') {
  if (!text) return '';

  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  return prefix ? `${prefix}-${slug}` : slug;
}
```

#### Estimated Impact
- **Lines Saved:** 20+ lines
- **Files Modified:** 4 modal components
- **New Code:** ~15 lines

---

### 5. Service CRUD Operations

#### Current State

**Files Affected:**
- `src/services/downloads.js`
- `src/services/admin.js`
- `src/services/registration.js`
- `src/services/speakers.js`
- `src/services/sessions.js`

#### Duplicated Pattern

```javascript
// Repeated in multiple services
export async function saveItem(itemId, itemData) {
  const itemRef = doc(db, COLLECTIONS.ITEMS, itemId);
  const existingDoc = await getDoc(itemRef);

  const data = {
    ...itemData,
    updatedAt: serverTimestamp(),
  };

  if (existingDoc.exists()) {
    await updateDoc(itemRef, data);
  } else {
    await setDoc(itemRef, {
      ...data,
      createdAt: serverTimestamp(),
    });
  }

  return { id: itemId, ...data };
}
```

#### Proposed Solution

Add to `src/lib/firestoreQueries.js`:

```javascript
/**
 * Upserts a document (update if exists, create if not)
 *
 * @param {string} collectionName - Firestore collection name
 * @param {string} docId - Document ID
 * @param {Object} data - Document data
 * @returns {Promise<Object>} Saved document with id
 */
export async function upsertDocument(collectionName, docId, data) {
  const docRef = doc(db, collectionName, docId);
  const existingDoc = await getDoc(docRef);

  const timestampedData = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  if (existingDoc.exists()) {
    await updateDoc(docRef, timestampedData);
  } else {
    await setDoc(docRef, {
      ...timestampedData,
      createdAt: serverTimestamp(),
    });
  }

  return { id: docId, ...data };
}

/**
 * Deletes a document by ID
 *
 * @param {string} collectionName - Firestore collection name
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
export async function deleteDocument(collectionName, docId) {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}
```

#### Estimated Impact
- **Lines Saved:** 100+ lines
- **Files Modified:** 5 service files
- **New Code:** ~40 lines

---

## Low Priority Deduplication

### 6. Time Formatting Utilities

#### Current State

**Files Affected:**
- `src/components/admin/SessionTable.js`
- Potentially other table/display components

#### Duplicated Pattern

```javascript
const formatTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};
```

#### Proposed Solution

Add to `src/utils/index.js`:

```javascript
/**
 * Formats 24-hour time string to 12-hour format with AM/PM
 *
 * @param {string} timeString - Time in HH:MM format
 * @returns {string} Formatted time (e.g., "2:30 PM")
 *
 * @example
 * formatTime('14:30') // '2:30 PM'
 * formatTime('09:00') // '9:00 AM'
 */
export function formatTime(timeString) {
  if (!timeString) return '';

  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minutes} ${ampm}`;
}
```

#### Estimated Impact
- **Lines Saved:** 8+ lines per occurrence
- **Files Modified:** 2+ components

---

### 7. Table Component Empty States

#### Current State

**Files Affected:**
- `src/components/admin/SessionTable.js`
- `src/components/admin/SpeakerTable.js`
- Other admin table components

#### Duplicated Pattern

```javascript
if (isLoading) {
  return (
    <div className={styles.container}>
      <div className={styles.skeleton} />
    </div>
  );
}

if (!items || items.length === 0) {
  return (
    <div className={styles.container}>
      <div className={styles.emptyState}>
        <svg>/* icon */</svg>
        <p>No items found</p>
        <span className={styles.emptyHint}>Click "Add" to create one.</span>
      </div>
    </div>
  );
}
```

#### Proposed Solution

Create `src/components/admin/TableStateWrapper.js`:

```javascript
/**
 * TableStateWrapper - Handles loading and empty states for tables
 *
 * @param {Object} props
 * @param {boolean} props.isLoading - Loading state
 * @param {Array} props.items - Items array
 * @param {string} props.emptyMessage - Message when no items
 * @param {string} props.emptyHint - Hint text for empty state
 * @param {React.ReactNode} props.children - Table content
 */
export function TableStateWrapper({
  isLoading,
  items,
  emptyMessage = 'No items found',
  emptyHint = 'Click "Add" to create one.',
  children,
}) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (!items || items.length === 0) {
    return <EmptyState message={emptyMessage} hint={emptyHint} />;
  }

  return children;
}
```

#### Estimated Impact
- **Lines Saved:** 100+ lines (20 per table × 5 tables)
- **Files Modified:** 5+ table components
- **New Files:** 1 (`TableStateWrapper.js`)

---

### 8. Form Field Components

#### Current State

Form fields with labels, inputs, error handling, and hints are repeated across modals.

#### Proposed Solution

Create `src/components/admin/FormField.js`:

```javascript
/**
 * FormField - Reusable form field with label, input, and validation
 */
export function FormField({
  label,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  required = false,
  ...inputProps
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={error ? styles.inputError : styles.input}
        {...inputProps}
      />
      {error && <span className={styles.error}>{error}</span>}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}
```

#### Estimated Impact
- **Lines Saved:** 50+ lines
- **Benefit:** Consistent form styling and validation

---

## Implementation Phases

### Phase 1: High Priority (Week 1-2)

| Task | Description | Dependencies |
|------|-------------|--------------|
| 1.1 | Create `BaseFormModal.js` | None |
| 1.2 | Create `BaseFormModal.module.css` | 1.1 |
| 1.3 | Refactor `SessionFormModal.js` | 1.1, 1.2 |
| 1.4 | Refactor `SpeakerFormModal.js` | 1.1, 1.2 |
| 1.5 | Refactor `FAQFormModal.js` | 1.1, 1.2 |
| 1.6 | Refactor `DownloadFormModal.js` | 1.1, 1.2 |
| 1.7 | Create `firestoreQueries.js` | None |
| 1.8 | Refactor `speakers.js` service | 1.7 |
| 1.9 | Refactor `sessions.js` service | 1.7 |
| 1.10 | Refactor `faq.js` service | 1.7 |
| 1.11 | Refactor `workshops.js` service | 1.7 |
| 1.12 | Run tests and verify | 1.1-1.11 |

### Phase 2: Medium Priority (Week 3-4)

| Task | Description | Dependencies |
|------|-------------|--------------|
| 2.1 | Create `useAdminCrudPage.js` hook | None |
| 2.2 | Refactor `AdminSpeakersPage.js` | 2.1 |
| 2.3 | Refactor `AdminSchedulePage.js` | 2.1 |
| 2.4 | Refactor `AdminFAQPage.js` | 2.1 |
| 2.5 | Refactor `AdminDownloadsPage.js` | 2.1 |
| 2.6 | Add `generateSlug` to utils | None |
| 2.7 | Update modals to use `generateSlug` | 2.6 |
| 2.8 | Add CRUD helpers to `firestoreQueries.js` | Phase 1 |
| 2.9 | Refactor services to use CRUD helpers | 2.8 |
| 2.10 | Run tests and verify | 2.1-2.9 |

### Phase 3: Low Priority (Week 5)

| Task | Description | Dependencies |
|------|-------------|--------------|
| 3.1 | Add `formatTime` to utils | None |
| 3.2 | Create `TableStateWrapper.js` | None |
| 3.3 | Refactor table components | 3.2 |
| 3.4 | Create `FormField.js` component | None |
| 3.5 | Update modals to use `FormField` | 3.4 |
| 3.6 | Final testing and cleanup | All |

---

## File Structure Changes

### New Files to Create

```
src/
├── components/
│   └── admin/
│       ├── BaseFormModal.js          # NEW
│       ├── BaseFormModal.module.css  # NEW
│       ├── TableStateWrapper.js      # NEW
│       └── FormField.js              # NEW
├── hooks/
│   └── useAdminCrudPage.js           # NEW
├── lib/
│   └── firestoreQueries.js           # NEW
└── utils/
    └── index.js                      # MODIFIED (add utilities)
```

### Files to Modify

```
src/
├── components/
│   └── admin/
│       ├── SessionFormModal.js       # MODIFY
│       ├── SpeakerFormModal.js       # MODIFY
│       ├── FAQFormModal.js           # MODIFY
│       ├── DownloadFormModal.js      # MODIFY
│       ├── SessionTable.js           # MODIFY
│       └── SpeakerTable.js           # MODIFY
├── pages/
│   └── admin/
│       ├── AdminSpeakersPage.js      # MODIFY
│       ├── AdminSchedulePage.js      # MODIFY
│       ├── AdminFAQPage.js           # MODIFY
│       └── AdminDownloadsPage.js     # MODIFY
└── services/
    ├── speakers.js                   # MODIFY
    ├── sessions.js                   # MODIFY
    ├── faq.js                        # MODIFY
    ├── workshops.js                  # MODIFY
    └── downloads.js                  # MODIFY
```

---

## Testing Strategy

### Unit Tests Required

1. **BaseFormModal.js**
   - Test click outside closes modal
   - Test escape key closes modal
   - Test body scroll lock/unlock
   - Test loading state display
   - Test error display

2. **useAdminCrudPage.js**
   - Test initial fetch on mount
   - Test loading state management
   - Test error handling
   - Test modal open/close handlers
   - Test refetch after save

3. **firestoreQueries.js**
   - Test `getDocById` with valid/invalid IDs
   - Test `getPublishedItems` query construction
   - Test `upsertDocument` create vs update
   - Test `mapDocsWithId` mapping

4. **Utility Functions**
   - Test `generateSlug` with various inputs
   - Test `formatTime` with edge cases

### Integration Tests

- Verify all refactored pages load correctly
- Verify CRUD operations still work
- Verify modal behavior unchanged
- Verify form submissions work

### Regression Testing

- Run full test suite after each phase
- Manual testing of all admin pages
- Cross-browser verification

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Lines of Code Reduced | 1000+ | Before/after line count |
| Test Coverage | Maintain 80%+ | Coverage report |
| Build Time | No increase | CI build metrics |
| Bug Reports | 0 regressions | Issue tracker |
| Developer Feedback | Positive | Team survey |

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Regressions in refactored code | High | Medium | Comprehensive testing, phased rollout |
| Breaking changes in API | High | Low | Keep function signatures compatible |
| Increased complexity | Medium | Low | Good documentation, code reviews |
| Team unfamiliarity with patterns | Low | Medium | Documentation, pair programming |

---

## Conclusion

This deduplication plan provides a systematic approach to reducing code duplication while improving maintainability and consistency. By following the phased implementation strategy and testing rigorously, we can achieve significant code reduction with minimal risk of regression.

The estimated 1000+ lines of code reduction will lead to:
- Faster development of new features
- Easier bug fixes (fix once, apply everywhere)
- Better consistency across the application
- Improved developer experience
