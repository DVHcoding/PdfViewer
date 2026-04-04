import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Swipeable } from 'react-swipeable';

import Button from 'components/Button';
import DataElements from 'constants/dataElement';
import actions from 'actions';
import selectors from 'selectors';
import core from 'core';

// Giả lập icon âm thanh bằng ký tự (bạn có thể thay bằng icon chuẩn sau)
const SoundIcon = () => <span style={{ fontSize: '16px' }}>🔊</span>;

import './ExtensionModal.scss';

const ExtensionModal = () => {
  const [isDisabled, isOpen, activeDocumentViewerKey] = useSelector((state) => [
    selectors.isElementDisabled(state, DataElements.EXTENSION_MODAL),
    selectors.isElementOpen(state, DataElements.EXTENSION_MODAL),
    selectors.getActiveDocumentViewerKey(state),
  ]);

  const [t] = useTranslation();
  const dispatch = useDispatch();

  // State
  const [selectedText, setSelectedText] = useState('');
  const [definition, setDefinition] = useState('');
  const [soundUkActive, setSoundUkActive] = useState(true);
  const [soundUsActive, setSoundUsActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const textFromPdf = core.getSelectedText(activeDocumentViewerKey);
      setSelectedText(textFromPdf || '');
    } else {
      setSelectedText('');
    }
  }, [isOpen, activeDocumentViewerKey]);

  const closeModal = () => {
    dispatch(actions.closeElement(DataElements.EXTENSION_MODAL));
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    // console.log('Text đã select:', selectedText);
    closeModal();
  };

  useEffect(() => {
    core.addEventListener('documentUnloaded', closeModal);
    return () => {
      core.removeEventListener('documentUnloaded', closeModal);
    };
  }, []);

  const modalClass = classNames({
    Modal: true,
    ExtensionModal: true,
    open: isOpen,
    closed: !isOpen,
  });

  if (isDisabled) {
    return null;
  }

  // Dữ liệu giả để test scrollbar
  const mockVocabularies = Array.from({ length: 10 }, (_, i) => ({
    _id: `id_${i}`,
    title: `Bộ từ vựng mẫu số ${i + 1}`,
  }));

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

          {/* --- BODY CHÍNH CÓ SCROLLBAR --- */}
          <div className="panel-body custom-scrollbar">
            <form className="form-container" onSubmit={handleConfirm}>
              {/* Nút Âm thanh */}
              <div className="phonetic-group">
                <div
                  className={`phonetic-btn ${soundUkActive ? 'active' : ''}`}
                  onClick={() => setSoundUkActive(!soundUkActive)}
                >
                  <span>UK</span>
                  <SoundIcon />
                </div>
                <div
                  className={`phonetic-btn ${soundUsActive ? 'active' : ''}`}
                  onClick={() => setSoundUsActive(!soundUsActive)}
                >
                  <span>US</span>
                  <SoundIcon />
                </div>
                <span className="phonetic-text">/fəˈnetɪk/</span>
              </div>

              {/* 2 Ô Textarea */}
              <div className="textarea-group">
                <div className="textarea-wrapper">
                  <textarea
                    className="custom-textarea"
                    rows="3"
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
                    value={definition}
                    onChange={(e) => setDefinition(e.target.value)}
                    required
                  />
                  <p className="textarea-label">Định nghĩa</p>
                </div>
              </div>

              {/* Danh sách Checkbox */}
              <ul className="list-items">
                {mockVocabularies.map((item) => (
                  <li key={item._id} className="list-item">
                    <input type="checkbox" className="custom-checkbox" />
                    <span className="item-title">{item.title}</span>
                  </li>
                ))}
              </ul>
              <p className="see-more-btn">See more...</p>
            </form>
          </div>

          <div className="divider"></div>

          {/* --- FOOTER --- */}
          <div className="footer">
            <Button
              className="ok-button"
              dataElement="extensionSubmitButton"
              label={t('Thêm vào')}
              onClick={handleConfirm}
            />
          </div>
        </div>
      </div>
    </Swipeable>
  );
};

export default ExtensionModal;
