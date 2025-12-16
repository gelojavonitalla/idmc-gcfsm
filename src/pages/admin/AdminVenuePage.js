/**
 * AdminVenuePage Component
 * Admin page for managing venue information, rooms, transportation, and amenities.
 *
 * @module pages/admin/AdminVenuePage
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin';
import {
  getConferenceSettings,
  updateConferenceSettings,
  getVenueRooms,
  createVenueRoom,
  updateVenueRoom,
  deleteVenueRoom,
  getVenueTransport,
  createVenueTransport,
  updateVenueTransport,
  deleteVenueTransport,
  getVenueAmenities,
  createVenueAmenity,
  updateVenueAmenity,
  deleteVenueAmenity,
  ROOM_TYPES,
  ROOM_TYPE_LABELS,
} from '../../services';
import styles from './AdminVenuePage.module.css';

/**
 * AdminVenuePage Component
 *
 * @returns {JSX.Element} The admin venue page
 */
function AdminVenuePage() {
  const [settings, setSettings] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [transport, setTransport] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingTransport, setEditingTransport] = useState(null);
  const [editingAmenity, setEditingAmenity] = useState(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [showAmenityModal, setShowAmenityModal] = useState(false);

  /**
   * Fetches all venue data
   */
  const fetchVenueData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [settingsData, roomsData, transportData, amenitiesData] = await Promise.all([
        getConferenceSettings(),
        getVenueRooms(),
        getVenueTransport(),
        getVenueAmenities(),
      ]);

      setSettings(settingsData);
      setRooms(roomsData);
      setTransport(transportData);
      setAmenities(amenitiesData);
    } catch (fetchError) {
      console.error('Failed to fetch venue data:', fetchError);
      setError('Failed to load venue data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch data on mount
   */
  useEffect(() => {
    fetchVenueData();
  }, [fetchVenueData]);

  /**
   * Shows success message temporarily
   *
   * @param {string} message - Message to display
   */
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  /**
   * Handles saving venue general settings
   *
   * @param {Event} e - Form submit event
   */
  const handleSaveGeneralSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData(e.target);
      const venueData = {
        ...settings,
        venue: {
          name: formData.get('venueName'),
          address: formData.get('venueAddress'),
          mapUrl: formData.get('mapUrl'),
          mapEmbedUrl: formData.get('mapEmbedUrl'),
        },
      };

      const updated = await updateConferenceSettings(venueData);
      setSettings(updated);
      showSuccess('Venue settings saved successfully!');
    } catch (saveError) {
      console.error('Failed to save venue settings:', saveError);
      setError('Failed to save venue settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles saving a room
   *
   * @param {Event} e - Form submit event
   */
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData(e.target);
      const roomData = {
        name: formData.get('name'),
        type: formData.get('type'),
        floor: formData.get('floor'),
        capacity: formData.get('capacity'),
        description: formData.get('description'),
        features: formData.get('features').split(',').map(f => f.trim()).filter(Boolean),
        sessionTypes: formData.get('sessionTypes').split(',').map(s => s.trim()).filter(Boolean),
        workshopTrack: formData.get('workshopTrack') || null,
        order: formData.get('order'),
      };

      if (editingRoom) {
        const updated = await updateVenueRoom(editingRoom.id, roomData);
        setRooms((prev) =>
          prev.map((room) => (room.id === editingRoom.id ? { ...room, ...updated } : room))
        );
        showSuccess('Room updated successfully!');
      } else {
        const created = await createVenueRoom(roomData);
        setRooms((prev) => [...prev, created]);
        showSuccess('Room created successfully!');
      }

      setShowRoomModal(false);
      setEditingRoom(null);
    } catch (saveError) {
      console.error('Failed to save room:', saveError);
      setError('Failed to save room. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles deleting a room
   *
   * @param {string} roomId - Room ID to delete
   */
  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) {
      return;
    }

    try {
      await deleteVenueRoom(roomId);
      setRooms((prev) => prev.filter((room) => room.id !== roomId));
      showSuccess('Room deleted successfully!');
    } catch (deleteError) {
      console.error('Failed to delete room:', deleteError);
      setError('Failed to delete room. Please try again.');
    }
  };

  /**
   * Handles saving a transport option
   *
   * @param {Event} e - Form submit event
   */
  const handleSaveTransport = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData(e.target);
      const transportData = {
        title: formData.get('title'),
        icon: formData.get('icon'),
        items: formData.get('items').split('\n').map(i => i.trim()).filter(Boolean),
        order: formData.get('order'),
      };

      if (editingTransport) {
        const updated = await updateVenueTransport(editingTransport.id, transportData);
        setTransport((prev) =>
          prev.map((t) => (t.id === editingTransport.id ? { ...t, ...updated } : t))
        );
        showSuccess('Transportation option updated successfully!');
      } else {
        const created = await createVenueTransport(transportData);
        setTransport((prev) => [...prev, created]);
        showSuccess('Transportation option created successfully!');
      }

      setShowTransportModal(false);
      setEditingTransport(null);
    } catch (saveError) {
      console.error('Failed to save transport:', saveError);
      setError('Failed to save transportation option. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles deleting a transport option
   *
   * @param {string} transportId - Transport ID to delete
   */
  const handleDeleteTransport = async (transportId) => {
    if (!window.confirm('Are you sure you want to delete this transportation option?')) {
      return;
    }

    try {
      await deleteVenueTransport(transportId);
      setTransport((prev) => prev.filter((t) => t.id !== transportId));
      showSuccess('Transportation option deleted successfully!');
    } catch (deleteError) {
      console.error('Failed to delete transport:', deleteError);
      setError('Failed to delete transportation option. Please try again.');
    }
  };

  /**
   * Handles saving an amenity
   *
   * @param {Event} e - Form submit event
   */
  const handleSaveAmenity = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData(e.target);
      const amenityData = {
        title: formData.get('title'),
        description: formData.get('description'),
        order: formData.get('order'),
      };

      if (editingAmenity) {
        const updated = await updateVenueAmenity(editingAmenity.id, amenityData);
        setAmenities((prev) =>
          prev.map((a) => (a.id === editingAmenity.id ? { ...a, ...updated } : a))
        );
        showSuccess('Amenity updated successfully!');
      } else {
        const created = await createVenueAmenity(amenityData);
        setAmenities((prev) => [...prev, created]);
        showSuccess('Amenity created successfully!');
      }

      setShowAmenityModal(false);
      setEditingAmenity(null);
    } catch (saveError) {
      console.error('Failed to save amenity:', saveError);
      setError('Failed to save amenity. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles deleting an amenity
   *
   * @param {string} amenityId - Amenity ID to delete
   */
  const handleDeleteAmenity = async (amenityId) => {
    if (!window.confirm('Are you sure you want to delete this amenity?')) {
      return;
    }

    try {
      await deleteVenueAmenity(amenityId);
      setAmenities((prev) => prev.filter((a) => a.id !== amenityId));
      showSuccess('Amenity deleted successfully!');
    } catch (deleteError) {
      console.error('Failed to delete amenity:', deleteError);
      setError('Failed to delete amenity. Please try again.');
    }
  };

  /**
   * Opens room modal for editing
   *
   * @param {Object} room - Room to edit (null for new)
   */
  const openRoomModal = (room = null) => {
    setEditingRoom(room);
    setShowRoomModal(true);
  };

  /**
   * Opens transport modal for editing
   *
   * @param {Object} transportItem - Transport to edit (null for new)
   */
  const openTransportModal = (transportItem = null) => {
    setEditingTransport(transportItem);
    setShowTransportModal(true);
  };

  /**
   * Opens amenity modal for editing
   *
   * @param {Object} amenity - Amenity to edit (null for new)
   */
  const openAmenityModal = (amenity = null) => {
    setEditingAmenity(amenity);
    setShowAmenityModal(true);
  };

  return (
    <AdminLayout title="Venue">
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Venue Management</h2>
          <p className={styles.subtitle}>
            Configure venue details, rooms, transportation, and nearby amenities.
          </p>
        </div>
        <button
          className={styles.refreshButton}
          onClick={fetchVenueData}
          disabled={isLoading}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className={styles.successBanner} role="status">
          {successMessage}
          <button onClick={() => setSuccessMessage(null)} aria-label="Dismiss message">
            &times;
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
          <button onClick={() => setError(null)} aria-label="Dismiss error">
            &times;
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'general' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          General
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'rooms' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Rooms
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'transport' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('transport')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg>
          Transportation
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'amenities' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('amenities')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Amenities
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneralSettings} className={styles.form}>
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Venue Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="venueName" className={styles.label}>
                    Venue Name
                  </label>
                  <input
                    type="text"
                    id="venueName"
                    name="venueName"
                    className={styles.input}
                    defaultValue={settings?.venue?.name || ''}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="venueAddress" className={styles.label}>
                    Address
                  </label>
                  <textarea
                    id="venueAddress"
                    name="venueAddress"
                    className={styles.textarea}
                    defaultValue={settings?.venue?.address || ''}
                    rows={2}
                    required
                  />
                </div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Map Configuration</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="mapUrl" className={styles.label}>
                    Google Maps URL
                    <span className={styles.labelHint}>Link for &quot;Get Directions&quot;</span>
                  </label>
                  <input
                    type="url"
                    id="mapUrl"
                    name="mapUrl"
                    className={styles.input}
                    defaultValue={settings?.venue?.mapUrl || ''}
                    placeholder="https://maps.google.com/?q=..."
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="mapEmbedUrl" className={styles.label}>
                    Map Embed URL
                    <span className={styles.labelHint}>For embedded map display</span>
                  </label>
                  <input
                    type="url"
                    id="mapEmbedUrl"
                    name="mapEmbedUrl"
                    className={styles.input}
                    defaultValue={settings?.venue?.mapEmbedUrl || ''}
                    placeholder="https://www.google.com/maps?q=...&output=embed"
                  />
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={isSaving || isLoading}
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}

        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className={styles.listSection}>
            <div className={styles.listHeader}>
              <h3 className={styles.sectionTitle}>Floor Plan Rooms</h3>
              <button
                className={styles.addButton}
                onClick={() => openRoomModal()}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Room
              </button>
            </div>

            {isLoading ? (
              <div className={styles.loading}>Loading rooms...</div>
            ) : rooms.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No rooms configured yet.</p>
                <button className={styles.addButton} onClick={() => openRoomModal()}>
                  Add Your First Room
                </button>
              </div>
            ) : (
              <div className={styles.cardGrid}>
                {rooms.map((room) => (
                  <div key={room.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h4 className={styles.cardTitle}>{room.name}</h4>
                      <span className={`${styles.badge} ${styles[`badge${room.type}`]}`}>
                        {ROOM_TYPE_LABELS[room.type] || room.type}
                      </span>
                    </div>
                    <div className={styles.cardBody}>
                      <p className={styles.cardMeta}>
                        <strong>Floor:</strong> {room.floor || 'N/A'}
                      </p>
                      <p className={styles.cardMeta}>
                        <strong>Capacity:</strong> {room.capacity || 'N/A'}
                      </p>
                      {room.description && (
                        <p className={styles.cardDescription}>{room.description}</p>
                      )}
                      {room.features && room.features.length > 0 && (
                        <div className={styles.cardTags}>
                          {room.features.map((feature, idx) => (
                            <span key={idx} className={styles.tag}>{feature}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => openRoomModal(room)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteRoom(room.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Transportation Tab */}
        {activeTab === 'transport' && (
          <div className={styles.listSection}>
            <div className={styles.listHeader}>
              <h3 className={styles.sectionTitle}>Transportation Options</h3>
              <button
                className={styles.addButton}
                onClick={() => openTransportModal()}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Option
              </button>
            </div>

            {isLoading ? (
              <div className={styles.loading}>Loading transportation options...</div>
            ) : transport.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No transportation options configured yet.</p>
                <button className={styles.addButton} onClick={() => openTransportModal()}>
                  Add Transportation Option
                </button>
              </div>
            ) : (
              <div className={styles.cardGrid}>
                {transport.map((t) => (
                  <div key={t.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h4 className={styles.cardTitle}>{t.title}</h4>
                    </div>
                    <div className={styles.cardBody}>
                      {t.items && t.items.length > 0 && (
                        <ul className={styles.itemList}>
                          {t.items.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => openTransportModal(t)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteTransport(t.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Amenities Tab */}
        {activeTab === 'amenities' && (
          <div className={styles.listSection}>
            <div className={styles.listHeader}>
              <h3 className={styles.sectionTitle}>Nearby Amenities</h3>
              <button
                className={styles.addButton}
                onClick={() => openAmenityModal()}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Amenity
              </button>
            </div>

            {isLoading ? (
              <div className={styles.loading}>Loading amenities...</div>
            ) : amenities.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No amenities configured yet.</p>
                <button className={styles.addButton} onClick={() => openAmenityModal()}>
                  Add Nearby Amenity
                </button>
              </div>
            ) : (
              <div className={styles.cardGrid}>
                {amenities.map((amenity) => (
                  <div key={amenity.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h4 className={styles.cardTitle}>{amenity.title}</h4>
                    </div>
                    <div className={styles.cardBody}>
                      {amenity.description && (
                        <p className={styles.cardDescription}>{amenity.description}</p>
                      )}
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => openAmenityModal(amenity)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteAmenity(amenity.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Room Modal */}
      {showRoomModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRoomModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingRoom ? 'Edit Room' : 'Add Room'}</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowRoomModal(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveRoom} className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="roomName" className={styles.label}>Name *</label>
                <input
                  type="text"
                  id="roomName"
                  name="name"
                  className={styles.input}
                  defaultValue={editingRoom?.name || ''}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="roomType" className={styles.label}>Type *</label>
                  <select
                    id="roomType"
                    name="type"
                    className={styles.select}
                    defaultValue={editingRoom?.type || ROOM_TYPES.WORKSHOP}
                    required
                  >
                    {Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="roomFloor" className={styles.label}>Floor</label>
                  <input
                    type="text"
                    id="roomFloor"
                    name="floor"
                    className={styles.input}
                    defaultValue={editingRoom?.floor || ''}
                    placeholder="e.g., Ground Floor"
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="roomCapacity" className={styles.label}>Capacity</label>
                  <input
                    type="number"
                    id="roomCapacity"
                    name="capacity"
                    className={styles.input}
                    defaultValue={editingRoom?.capacity || ''}
                    min="0"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="roomOrder" className={styles.label}>Display Order</label>
                  <input
                    type="number"
                    id="roomOrder"
                    name="order"
                    className={styles.input}
                    defaultValue={editingRoom?.order || 0}
                    min="0"
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="roomDescription" className={styles.label}>Description</label>
                <textarea
                  id="roomDescription"
                  name="description"
                  className={styles.textarea}
                  defaultValue={editingRoom?.description || ''}
                  rows={3}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="roomFeatures" className={styles.label}>
                  Features
                  <span className={styles.labelHint}>Comma-separated list</span>
                </label>
                <input
                  type="text"
                  id="roomFeatures"
                  name="features"
                  className={styles.input}
                  defaultValue={editingRoom?.features?.join(', ') || ''}
                  placeholder="e.g., Projector, Sound System, Air Conditioning"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="roomSessionTypes" className={styles.label}>
                  Session Types
                  <span className={styles.labelHint}>Comma-separated list</span>
                </label>
                <input
                  type="text"
                  id="roomSessionTypes"
                  name="sessionTypes"
                  className={styles.input}
                  defaultValue={editingRoom?.sessionTypes?.join(', ') || ''}
                  placeholder="e.g., Workshop, Plenary"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="roomWorkshopTrack" className={styles.label}>Workshop Track</label>
                <input
                  type="text"
                  id="roomWorkshopTrack"
                  name="workshopTrack"
                  className={styles.input}
                  defaultValue={editingRoom?.workshopTrack || ''}
                  placeholder="e.g., Next Generation, Women"
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowRoomModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : editingRoom ? 'Update Room' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transport Modal */}
      {showTransportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowTransportModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingTransport ? 'Edit Transportation' : 'Add Transportation'}</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowTransportModal(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveTransport} className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="transportTitle" className={styles.label}>Title *</label>
                <input
                  type="text"
                  id="transportTitle"
                  name="title"
                  className={styles.input}
                  defaultValue={editingTransport?.title || ''}
                  placeholder="e.g., By Car, By Public Transport"
                  required
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="transportIcon" className={styles.label}>Icon</label>
                  <select
                    id="transportIcon"
                    name="icon"
                    className={styles.select}
                    defaultValue={editingTransport?.icon || 'car'}
                  >
                    <option value="car">Car</option>
                    <option value="bus">Bus/Public Transport</option>
                    <option value="parking">Parking</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="transportOrder" className={styles.label}>Display Order</label>
                  <input
                    type="number"
                    id="transportOrder"
                    name="order"
                    className={styles.input}
                    defaultValue={editingTransport?.order || 0}
                    min="0"
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="transportItems" className={styles.label}>
                  Directions/Instructions
                  <span className={styles.labelHint}>One per line</span>
                </label>
                <textarea
                  id="transportItems"
                  name="items"
                  className={styles.textarea}
                  defaultValue={editingTransport?.items?.join('\n') || ''}
                  rows={5}
                  placeholder="Enter each direction on a new line..."
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowTransportModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : editingTransport ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Amenity Modal */}
      {showAmenityModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAmenityModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingAmenity ? 'Edit Amenity' : 'Add Amenity'}</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowAmenityModal(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveAmenity} className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="amenityTitle" className={styles.label}>Title *</label>
                <input
                  type="text"
                  id="amenityTitle"
                  name="title"
                  className={styles.input}
                  defaultValue={editingAmenity?.title || ''}
                  placeholder="e.g., Restaurants & Cafes"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="amenityOrder" className={styles.label}>Display Order</label>
                <input
                  type="number"
                  id="amenityOrder"
                  name="order"
                  className={styles.input}
                  defaultValue={editingAmenity?.order || 0}
                  min="0"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="amenityDescription" className={styles.label}>Description</label>
                <textarea
                  id="amenityDescription"
                  name="description"
                  className={styles.textarea}
                  defaultValue={editingAmenity?.description || ''}
                  rows={4}
                  placeholder="Describe the nearby amenities..."
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowAmenityModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : editingAmenity ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminVenuePage;
