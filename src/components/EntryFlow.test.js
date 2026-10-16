import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { useApp } from '../context/AppContext';
import EntryForm from './EntryForm';
import ConfirmEntryModal from './ConfirmEntryModal';
import { MAX_METERS } from '../constants';

jest.mock('../context/AppContext', () => ({ useApp: jest.fn() }));

let container;
let root;
let context;

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  context = {
    showLogModal: true, setShowLogModal: jest.fn(),
    showConfirmModal: true, setShowConfirmModal: jest.fn(),
    fileInputRef: React.createRef(), galleryInputRef: React.createRef(),
    handleImageUpload: jest.fn(), isProcessing: false, processingStatus: '',
    userProfile: { name: 'Test rower', defaultMachine: 'concept2' }, isAdmin: false,
    manualMeters: '', setManualMeters: jest.fn(), manualTime: '', setManualTime: jest.fn(),
    manualCalories: '', setManualCalories: jest.fn(), isSubmittingManual: false, handleManualSubmit: jest.fn(),
    aiMachineType: '', setAiMachineType: jest.fn(), customMachineName: '', setCustomMachineName: jest.fn(),
    sessionType: 'free_row', setSessionType: jest.fn(), testMode: false, setTestMode: jest.fn(),
    validationError: '', setValidationError: jest.fn(),
    capturedImage: { data: 'data:image/png;base64,AAAA', claudeResult: { extractedMeters: 5000, confidence: 95 } },
    setCapturedImage: jest.fn(), editableMeters: '5000', setEditableMeters: jest.fn(),
    editableTime: '23:45', setEditableTime: jest.fn(), editableCalories: '250', setEditableCalories: jest.fn(),
    detectedMeters: '5000', detectedTime: '23:45', detectedCalories: '250', handleConfirmEntry: jest.fn(),
  };
  useApp.mockImplementation(() => context);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
});

const render = component => act(() => root.render(component));
const button = text => Array.from(container.querySelectorAll('button')).find(el => el.textContent.includes(text));
const click = element => act(() => Simulate.click(element));
const escape = () => act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));

test('photo is the initial method and camera/library preserve separate native file inputs', () => {
  render(<EntryForm />);
  const dialog = container.querySelector('[role="dialog"]');
  expect(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent).toBe('Log your row');
  expect(document.activeElement).toBe(container.querySelector('[role="dialog"]'));
  expect(container.querySelector('#manual-row-meters')).toBeNull();
  expect(context.fileInputRef.current.getAttribute('capture')).toBe('environment');
  expect(context.galleryInputRef.current.hasAttribute('capture')).toBe(false);
  const camera = jest.spyOn(context.fileInputRef.current, 'click').mockImplementation(() => {});
  const gallery = jest.spyOn(context.galleryInputRef.current, 'click').mockImplementation(() => {});
  click(button('Take a photo'));
  click(button('Choose a photo'));
  expect(camera).toHaveBeenCalledTimes(1);
  expect(gallery).toHaveBeenCalledTimes(1);
});

test('manual mode validates distance before calling the existing submit handler', () => {
  render(<EntryForm />);
  click(button('Manual'));
  expect(container.querySelector('label[for="manual-row-meters"]')).not.toBeNull();
  expect(button('Log row').disabled).toBe(true);
  context.manualMeters = String(MAX_METERS);
  render(<EntryForm />);
  expect(button('Log 50,000 m').disabled).toBe(false);
  act(() => Simulate.submit(container.querySelector('form')));
  expect(context.handleManualSubmit).toHaveBeenCalledTimes(1);
  context.manualMeters = '99';
  render(<EntryForm />);
  act(() => Simulate.submit(container.querySelector('form')));
  expect(context.handleManualSubmit).toHaveBeenCalledTimes(1);
});

test('upload in progress cannot be dismissed or switched to a second submission', () => {
  context.isProcessing = true;
  context.processingStatus = 'Reading display…';
  render(<EntryForm />);
  expect(button('Take a photo').disabled).toBe(true);
  expect(button('Manual').disabled).toBe(true);
  expect(container.querySelector('[role="status"]').textContent).toContain('Reading display');
  escape();
  click(container.querySelector('.entry-flow-overlay'));
  expect(context.setShowLogModal).not.toHaveBeenCalled();
  context.isProcessing = false;
  render(<EntryForm />);
  escape();
  expect(context.setShowLogModal).toHaveBeenCalledWith(false);
});

test('review displays extracted fields, permits corrections, and saves through the original handler', () => {
  render(<ConfirmEntryModal />);
  expect(document.activeElement).toBe(container.querySelector('[role="dialog"]'));
  expect(container.querySelector('label[for="review-row-meters"]')).not.toBeNull();
  expect(container.querySelector('#review-row-meters').value).toBe('5000');
  expect(container.textContent).toContain('From photo');
  act(() => Simulate.change(container.querySelector('#review-row-meters'), { target: { value: '5100' } }));
  expect(context.setEditableMeters).toHaveBeenCalledWith('5100');
  act(() => Simulate.submit(container.querySelector('form')));
  expect(context.handleConfirmEntry).toHaveBeenCalledTimes(1);
});

test('review blocks invalid meters/time and all dismissals during saving', () => {
  context.editableMeters = String(MAX_METERS + 1);
  render(<ConfirmEntryModal />);
  expect(button('Log row').disabled).toBe(true);
  context.editableMeters = '5000';
  context.editableTime = 'bad time';
  render(<ConfirmEntryModal />);
  expect(container.querySelector('#review-row-time').getAttribute('aria-invalid')).toBe('true');
  expect(button('Log 5,000 m').disabled).toBe(true);
  context.editableTime = '23:45';
  context.isProcessing = true;
  render(<ConfirmEntryModal />);
  expect(container.querySelector('#review-row-meters').disabled).toBe(true);
  expect(button('Choose another photo').disabled).toBe(true);
  escape();
  click(container.querySelector('.entry-flow-overlay'));
  act(() => Simulate.submit(container.querySelector('form')));
  expect(context.setShowConfirmModal).not.toHaveBeenCalled();
  expect(context.handleConfirmEntry).not.toHaveBeenCalled();
});

test('another photo returns to the picker and removes the abandoned captured image', () => {
  context.capturedImage.claudeResult.confidence = 30;
  render(<ConfirmEntryModal />);
  expect(container.textContent).toContain('Some numbers were hard to read');
  click(button('Choose another photo'));
  expect(context.setCapturedImage).toHaveBeenCalledWith(null);
  expect(context.setShowConfirmModal).toHaveBeenCalledWith(false);
  expect(context.setShowLogModal).toHaveBeenCalledWith(true);
  expect(context.handleConfirmEntry).not.toHaveBeenCalled();
});
