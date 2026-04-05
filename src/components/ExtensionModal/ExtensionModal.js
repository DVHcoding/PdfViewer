import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Swipeable } from 'react-swipeable';

import actions from 'actions';
import Button from 'components/Button';
import Icon from 'components/Icon';
import DataElements from 'constants/dataElement';
import core from 'core';
import selectors from 'selectors';
import { showToast } from 'components/Toast/Toasts';

import { fetchMeaningWord, fetchVocabularies, updateQuickVocabulary } from './fluentezApi';

import './ExtensionModal.scss';

const ExtensionModal = () => {
  const [isDisabled, isOpen, activeDocumentViewerKey] = useSelector((state) => [
    selectors.isElementDisabled(state, DataElements.EXTENSION_MODAL),
    selectors.isElementOpen(state, DataElements.EXTENSION_MODAL),
    selectors.getActiveDocumentViewerKey(state),
  ]);

  const [t] = useTranslation();
  const dispatch = useDispatch();
  const audioRef = useRef(null);

  const [selectedText, setSelectedText] = useState('');
  const [definition, setDefinition] = useState('');

  const [phonetic, setPhonetic] = useState(null);
  const [phoneticLoading, setPhoneticLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [vocabularies, setVocabularies] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [vocabLoading, setVocabLoading] = useState(false);
  const [vocabError, setVocabError] = useState(null);

  const [selectedVocabulary, setSelectedVocabulary] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const closeModal = useCallback(() => {
    dispatch(actions.closeElement(DataElements.EXTENSION_MODAL));
  }, [dispatch]);

  const resetState = useCallback(() => {
    setSelectedText('');
    setDefinition('');
    setPhonetic(null);
    setPage(1);
    setVocabularies([]);
    setTotalCount(0);
    setSelectedVocabulary(null);
    setVocabError(null);
  }, []);

  const loadVocabularies = useCallback(async (pageNum) => {
    setVocabLoading(true);
    setVocabError(null);
    try {
      const result = await fetchVocabularies(pageNum, 7);
      const newVocabs = result.data || [];
      setTotalCount(result.totalCount || 0);

      setVocabularies((prev) => {
        const existingIds = new Set(prev.map((v) => v._id));
        const unique = newVocabs.filter((v) => !existingIds.has(v._id));
        return [...prev, ...unique];
      });
    } catch (err) {
      setVocabError(err.message || 'Không thể tải danh sách từ vựng');
    } finally {
      setVocabLoading(false);
    }
  }, []);

  const loadMeaning = useCallback(async (text) => {
    if (!text || !text.trim()) {
      setPhonetic(null);
      setDefinition('');
      return;
    }
    setPhoneticLoading(true);
    try {
      const result = await fetchMeaningWord(text);
      if (result && result.data) {
        setPhonetic(result.data);
        setDefinition(result.data.meaning || '');
      } else {
        setPhonetic(null);
        setDefinition('');
      }
    } catch {
      setPhonetic(null);
      setDefinition('');
    } finally {
      setPhoneticLoading(false);
    }
  }, []);

  const playAudio = useCallback((audioUrl) => {
    if (!audioUrl) {
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.play().catch((err) => {
      console.warn('[ExtensionModal] Audio playback failed:', err);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedText.trim() || !definition.trim()) {
      showToast('Thuật ngữ và định nghĩa không được bỏ trống!');
      return;
    }

    if (!selectedVocabulary) {
      showToast('Vui lòng chọn bộ từ vựng để lưu!');
      return;
    }

    setSubmitLoading(true);
    try {
      await updateQuickVocabulary({
        vocabulary: { term: selectedText, definition },
        vocabularyId: selectedVocabulary,
      });
      showToast('Thêm từ vựng thành công!');
      resetState();
      closeModal();
    } catch (err) {
      showToast('Lưu từ vựng thất bại. Vui lòng thử lại!');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedVocabulary((prev) => (prev === id ? null : id));
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      const textFromPdf = core.getSelectedText(activeDocumentViewerKey);
      const text = (textFromPdf || '').trim();
      setSelectedText(text);

      setPage(1);
      setVocabularies([]);
      loadVocabularies(1);

      if (text) {
        loadMeaning(text);
      }
    } else {
      resetState();
    }
  }, [isOpen, activeDocumentViewerKey, loadVocabularies, loadMeaning, resetState]);

  useEffect(() => {
    if (page > 1) {
      loadVocabularies(page);
    }
  }, [page, loadVocabularies]);

  useEffect(() => {
    core.addEventListener('documentUnloaded', closeModal);
    return () => {
      core.removeEventListener('documentUnloaded', closeModal);
    };
  }, [closeModal]);

  const modalClass = classNames({
    Modal: true,
    ExtensionModal: true,
    open: isOpen,
    closed: !isOpen,
  });

  if (isDisabled) {
    return null;
  }

  const hasSoundUk = Boolean(phonetic && phonetic.soundUk);
  const hasSoundUs = Boolean(phonetic && phonetic.soundUs);
  const hasMoreVocabularies = vocabularies.length < totalCount;

  return (
    <Swipeable onSwipedUp={closeModal} onSwipedDown={closeModal} preventDefaultTouchmoveEvent>
      <div className={modalClass} data-element={DataElements.EXTENSION_MODAL} onMouseDown={closeModal}>
        <div className="container" onMouseDown={(e) => e.stopPropagation()}>
          <div className="swipe-indicator" />

          {/* --- HEADER --- */}
          <div className="header-container">
            <div className="header">
              <p>Fluentez-extension</p>
              <Button img="icon-close" onClick={closeModal} title="action.close" />
            </div>
          </div>

          <div className="divider"></div>

          <div className="panel-body">
            <form className="form-container" onSubmit={handleSubmit}>
              <div className="phonetic-group">
                <div
                  className={`phonetic-btn ${hasSoundUk ? 'sound-active' : 'sound-inactive'}`}
                  onClick={() => playAudio(phonetic?.soundUk || '')}
                >
                  <span>UK</span>
                  <Icon glyph="ic_volume_24px" />
                </div>

                <div
                  className={`phonetic-btn ${hasSoundUs ? 'sound-active' : 'sound-inactive'}`}
                  onClick={() => playAudio(phonetic?.soundUs || '')}
                >
                  <span>US</span>
                  <Icon glyph="ic_volume_24px" />
                </div>

                {phonetic?.ukPhonetic && <span className="phonetic-text">{phonetic.ukPhonetic}</span>}
                {phonetic?.usPhonetic && <span className="phonetic-text">{phonetic.usPhonetic}</span>}

                {phoneticLoading && (
                  <span className="phonetic-text" style={{ fontStyle: 'italic' }}>
                    Đang tra...
                  </span>
                )}
              </div>

              <div className="textarea-group">
                <div className="textarea-wrapper">
                  <textarea
                    className="custom-textarea"
                    rows="3"
                    maxLength={500}
                    value={selectedText}
                    onChange={(e) => setSelectedText(e.target.value)}
                    required
                  />
                  <p className="textarea-label">Thuật ngữ</p>
                </div>

                <div className="textarea-wrapper">
                  <textarea
                    className="custom-textarea"
                    rows="3"
                    maxLength={500}
                    value={definition}
                    onChange={(e) => setDefinition(e.target.value)}
                    required
                  />
                  <p className="textarea-label">Định nghĩa</p>
                </div>
              </div>

              <ul className="list-items">
                {vocabularies.map((item) => (
                  <li key={item._id} className="list-item">
                    <input
                      type="checkbox"
                      className="custom-checkbox"
                      checked={selectedVocabulary === item._id}
                      onChange={() => handleCheckboxChange(item._id)}
                    />
                    <span className="item-title">{item.title}</span>
                  </li>
                ))}
              </ul>

              {vocabError && (
                <p style={{ fontSize: '13px', color: 'var(--error-text-color)', margin: 0 }}>{vocabError}</p>
              )}

              {vocabularies.length === 0 && !vocabLoading && !vocabError && (
                <p style={{ fontSize: '13px', color: 'var(--faded-text)', margin: 0 }}>Bạn chưa tạo bộ từ vựng nào!</p>
              )}

              {vocabLoading && (
                <p style={{ fontSize: '13px', color: 'var(--faded-text)', fontStyle: 'italic', margin: 0 }}>
                  Đang tải...
                </p>
              )}

              {!vocabLoading && hasMoreVocabularies && (
                <p className="see-more-btn" onClick={handleLoadMore}>
                  See more...
                </p>
              )}
            </form>
          </div>

          <div className="divider"></div>

          <div className="footer">
            <Button
              className="ok-button"
              dataElement="extensionSubmitButton"
              label={submitLoading ? t('Đang lưu...') : t('Thêm vào')}
              onClick={handleSubmit}
              disabled={submitLoading}
            />
          </div>
        </div>
      </div>
    </Swipeable>
  );
};

export default ExtensionModal;
