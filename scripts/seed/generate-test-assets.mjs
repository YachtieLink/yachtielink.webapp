#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

const h = React.createElement

const PROJECT_ROOT = process.cwd()
const ASSET_ROOT = path.join(PROJECT_ROOT, 'scripts/seed/assets')
const PROFILE_DIR = path.join(ASSET_ROOT, 'profiles')
const GALLERY_DIR = path.join(ASSET_ROOT, 'gallery')
const CV_DIR = path.join(ASSET_ROOT, 'cvs')
const YACHT_DIR = path.join(ASSET_ROOT, 'yachts')
const MANUAL_ROOT = path.join(ASSET_ROOT, 'manual')
const MANUAL_PROFILE_DIR = path.join(MANUAL_ROOT, 'profiles')
const MANUAL_GALLERY_DIR = path.join(MANUAL_ROOT, 'gallery')
const MANUAL_YACHT_DIR = path.join(MANUAL_ROOT, 'yachts')
const TEMP_DIR = path.join(os.tmpdir(), 'yachtielink-seed-assets')
const AS_OF_DATE = '2026-03-26'
const FORCE_REGENERATE = process.argv.includes('--force')

const DEPARTMENT_COLORS = {
  Deck: '#2a6f7f',
  Interior: '#c58a65',
  Engineering: '#495c73',
  Galley: '#8a5c4a',
  Medical: '#467b72',
  Other: '#4d6d8a',
  Admin: '#6f5f88',
}

const YACHTS = [
  { name: 'TS Artemis', slug: 'artemis', yachtType: 'Motor Yacht', lengthMeters: 65, builder: 'Lürssen', flagState: 'Cayman Islands', coverPalette: ['#f4c787', '#8cc0da', '#2b5f6f'] },
  { name: 'TS Blue Horizon', slug: 'blue-horizon', yachtType: 'Motor Yacht', lengthMeters: 52, builder: 'Benetti', flagState: 'Marshall Islands', coverPalette: ['#9fd5f2', '#dceef7', '#35687a'] },
  { name: 'TS Celestia', slug: 'celestia', yachtType: 'Sailing Yacht', lengthMeters: 43, builder: 'Oyster', flagState: 'Malta', coverPalette: ['#f6d8aa', '#8fc7cf', '#2f4f73'] },
  { name: 'TS Driftwood', slug: 'driftwood', yachtType: 'Motor Yacht', lengthMeters: 78, builder: 'Feadship', flagState: 'Bermuda', coverPalette: ['#efb58a', '#90b8d4', '#36516c'] },
  { name: 'TS Eclipse Star', slug: 'eclipse-star', yachtType: 'Motor Yacht', lengthMeters: 90, builder: 'Oceanco', flagState: 'Cayman Islands', coverPalette: ['#f8d4a2', '#a4c5dc', '#263f58'] },
  { name: 'TS Falcon III', slug: 'falcon-iii', yachtType: 'Sailing Yacht', lengthMeters: 38, builder: 'Baltic Yachts', flagState: 'UK', coverPalette: ['#f4d9bb', '#9cc9dd', '#34516c'] },
  { name: 'TS Golden Reef', slug: 'golden-reef', yachtType: 'Motor Yacht', lengthMeters: 55, builder: 'Amels', flagState: 'Marshall Islands', coverPalette: ['#f7c96d', '#88c1d1', '#2f6772'] },
  { name: 'TS Harbour Light', slug: 'harbour-light', yachtType: 'Motor Yacht', lengthMeters: 48, builder: 'Sanlorenzo', flagState: 'Malta', coverPalette: ['#f7d0a5', '#8dbbc8', '#35556f'] },
  { name: 'TS Iris', slug: 'iris', yachtType: 'Motor Yacht', lengthMeters: 70, builder: 'Heesen', flagState: 'Cayman Islands', coverPalette: ['#f3cfb7', '#97bfd7', '#30526a'] },
  { name: 'TS Jade Wave', slug: 'jade-wave', yachtType: 'Sailing Yacht', lengthMeters: 34, builder: 'Perini Navi', flagState: 'Netherlands', coverPalette: ['#eecfa3', '#8ec1bf', '#35546b'] },
]

const USERS = [
  { first: 'James', last: 'Whitfield', role: 'Captain', department: 'Deck', nationality: 'United Kingdom', dob: '1982-06-14', template: 'clean', portrait: { skin: '#e4bc99', hair: '#826853', shirt: '#274f63', backdrop: '#dfeff2', accent: '#4b8da6', style: 'short', ageBand: 'senior' } },
  { first: 'Sofia', last: 'Marinova', role: 'First Officer', department: 'Deck', nationality: 'Bulgaria', dob: '1990-03-22', template: 'clean', portrait: { skin: '#ddb28d', hair: '#43322d', shirt: '#35667a', backdrop: '#dceff0', accent: '#4f9baa', style: 'bun', ageBand: 'mid' } },
  { first: 'Marcus', last: 'Du Plessis', role: 'Bosun', department: 'Deck', nationality: 'South Africa', dob: '1993-11-05', template: 'clean', portrait: { skin: '#a86a4d', hair: '#2d201b', shirt: '#2b5e70', backdrop: '#d8ebea', accent: '#4e8f78', style: 'fade', ageBand: 'mid' } },
  { first: 'Liam', last: "O'Connor", role: 'Lead Deckhand', department: 'Deck', nationality: 'Ireland', dob: '1996-08-17', template: 'clean', portrait: { skin: '#f0c7a3', hair: '#7d553d', shirt: '#2c6674', backdrop: '#e4f1ef', accent: '#67a6a4', style: 'wave', ageBand: 'junior' } },
  { first: 'Tyler', last: 'Jensen', role: 'Deckhand', department: 'Deck', nationality: 'Australia', dob: '1999-02-28', template: 'clean', portrait: { skin: '#ebc39f', hair: '#8f7a56', shirt: '#3d7386', backdrop: '#e3f1f2', accent: '#69a9c0', style: 'short', ageBand: 'junior' } },
  { first: 'Charlotte', last: 'Beaumont', role: 'Chief Stewardess', department: 'Interior', nationality: 'France', dob: '1988-12-03', template: 'clean', portrait: { skin: '#edc6a8', hair: '#5b3c31', shirt: '#8d6370', backdrop: '#f7eee7', accent: '#d7a07a', style: 'bun', ageBand: 'mid' } },
  { first: 'Elena', last: 'Rossi', role: 'Second Stewardess', department: 'Interior', nationality: 'Italy', dob: '1994-07-19', template: 'clean', portrait: { skin: '#d5a27f', hair: '#352924', shirt: '#976d6a', backdrop: '#f5ebe1', accent: '#d6a277', style: 'long', ageBand: 'mid' } },
  { first: 'Mia', last: 'Van der Berg', role: 'Stewardess', department: 'Interior', nationality: 'Netherlands', dob: '1997-01-11', template: 'clean', portrait: { skin: '#f0ccb0', hair: '#d4ba7d', shirt: '#a7757f', backdrop: '#f7eee8', accent: '#d7b281', style: 'pony', ageBand: 'junior' } },
  { first: 'Zara', last: 'Okafor', role: 'Stewardess', department: 'Interior', nationality: 'Nigeria', dob: '1998-05-30', template: 'clean', portrait: { skin: '#6a402c', hair: '#191311', shirt: '#8d6774', backdrop: '#f1e4dd', accent: '#bf8c66', style: 'curly', ageBand: 'junior' } },
  { first: 'Hannah', last: 'Fischer', role: 'Junior Stewardess', department: 'Interior', nationality: 'Germany', dob: '2000-09-14', template: 'clean', portrait: { skin: '#efd0b7', hair: '#b4966a', shirt: '#b2828e', backdrop: '#f8efe8', accent: '#d8ae89', style: 'pony', ageBand: 'junior' } },
  { first: 'David', last: 'Kowalski', role: 'Chief Engineer', department: 'Engineering', nationality: 'Poland', dob: '1979-04-08', template: 'alternate', portrait: { skin: '#e2bc9d', hair: '#57514c', shirt: '#4b556d', backdrop: '#e8edf2', accent: '#7086a6', style: 'short', ageBand: 'senior' } },
  { first: 'Ryan', last: 'Campbell', role: 'Second Engineer', department: 'Engineering', nationality: 'New Zealand', dob: '1991-10-22', template: 'alternate', portrait: { skin: '#e7c09d', hair: '#6b4d38', shirt: '#526377', backdrop: '#e7edf2', accent: '#6d8aa6', style: 'short', ageBand: 'mid' } },
  { first: 'Kai', last: 'Nakamura', role: 'ETO', department: 'Engineering', nationality: 'Japan', dob: '1993-06-01', template: 'alternate', portrait: { skin: '#d9b698', hair: '#241f1f', shirt: '#52626d', backdrop: '#e9eef1', accent: '#7197a6', style: 'short', ageBand: 'mid' } },
  { first: 'Pierre', last: 'Laurent', role: 'Head Chef', department: 'Galley', nationality: 'France', dob: '1985-08-25', template: 'alternate', portrait: { skin: '#e8c3a2', hair: '#3e312b', shirt: '#6c4b44', backdrop: '#f2ece7', accent: '#c38c67', style: 'chef', ageBand: 'senior' } },
  { first: 'Anna', last: 'Svensson', role: 'Sous Chef', department: 'Galley', nationality: 'Sweden', dob: '1992-03-17', template: 'alternate', portrait: { skin: '#f1d4bb', hair: '#d0ba88', shirt: '#7f5a4e', backdrop: '#f5eee8', accent: '#d3a17b', style: 'chef-long', ageBand: 'mid' } },
  { first: 'Jake', last: 'Thompson', role: 'Crew Cook', department: 'Galley', nationality: 'United Kingdom', dob: '1995-12-09', template: 'alternate', portrait: { skin: '#ecc6a4', hair: '#604837', shirt: '#825d52', backdrop: '#f4ede7', accent: '#c59675', style: 'chef', ageBand: 'mid' } },
  { first: 'Sarah', last: 'Adams', role: 'Nurse', department: 'Medical', nationality: 'United States', dob: '1987-11-20', template: 'alternate', portrait: { skin: '#ecc5aa', hair: '#62473f', shirt: '#5f9188', backdrop: '#e8f0ed', accent: '#7fb2aa', style: 'bun', ageBand: 'mid' } },
  { first: 'Lucy', last: 'Zhao', role: 'Nanny', department: 'Other', nationality: 'Australia', dob: '1994-04-15', template: 'messy', portrait: { skin: '#e0b8a0', hair: '#241f1f', shirt: '#597498', backdrop: '#e5ecf4', accent: '#84a7c5', style: 'long', ageBand: 'mid' } },
  { first: 'Tom', last: 'Rivera', role: 'Dive Instructor', department: 'Other', nationality: 'Spain', dob: '1991-07-04', template: 'messy', portrait: { skin: '#d4a07a', hair: '#2b2320', shirt: '#2f7484', backdrop: '#dff0f2', accent: '#63a8b6', style: 'wave', ageBand: 'mid' } },
  { first: 'Olivia', last: 'Chen', role: 'Purser', department: 'Admin', nationality: 'Singapore', dob: '1989-02-14', template: 'messy', portrait: { skin: '#d8b59d', hair: '#1f1b1a', shirt: '#77698f', backdrop: '#ece8f3', accent: '#9b89b8', style: 'bob', ageBand: 'mid' } },
  { first: 'Ben', last: 'Harris', role: 'Deckhand', department: 'Deck', nationality: 'United Kingdom', dob: '1997-06-22', template: 'messy', portrait: { skin: '#ecc5a5', hair: '#6a5439', shirt: '#336d7f', backdrop: '#e2f0f0', accent: '#6da8b7', style: 'short', ageBand: 'junior' } },
  { first: 'Chloe', last: 'Martin', role: 'Third Stewardess', department: 'Interior', nationality: 'South Africa', dob: '1998-10-08', template: 'messy', portrait: { skin: '#a06a53', hair: '#231a18', shirt: '#936f73', backdrop: '#f4e7df', accent: '#cf9678', style: 'curly', ageBand: 'junior' } },
  { first: 'Finn', last: 'Murphy', role: 'Second Officer', department: 'Deck', nationality: 'Ireland', dob: '1994-01-30', template: 'messy', portrait: { skin: '#efc9aa', hair: '#6c4d3f', shirt: '#326779', backdrop: '#e1f1ef', accent: '#69a6b0', style: 'wave', ageBand: 'mid' } },
  { first: 'Grace', last: 'Kim', role: 'Stewardess', department: 'Interior', nationality: 'South Korea', dob: '1995-05-19', template: 'messy', portrait: { skin: '#e5c0aa', hair: '#1e1a1a', shirt: '#9b7280', backdrop: '#f6ebe7', accent: '#d8a491', style: 'long', ageBand: 'mid' } },
  { first: 'Hugo', last: 'Bergström', role: 'Engineer', department: 'Engineering', nationality: 'Sweden', dob: '1998-08-11', template: 'messy', portrait: { skin: '#f0d1b7', hair: '#d4b977', shirt: '#59677a', backdrop: '#e7edf2', accent: '#8ba1b8', style: 'short', ageBand: 'junior' } },
]

const ASSIGNMENTS = {
  James: [
    { yacht: 'TS Artemis', role: 'Captain', start: '2020-03-01', end: '2023-06-30', area: 'Mediterranean' },
    { yacht: 'TS Driftwood', role: 'Captain', start: '2023-09-01', end: null, area: 'Caribbean' },
  ],
  Sofia: [
    { yacht: 'TS Artemis', role: 'First Officer', start: '2021-01-01', end: '2023-06-30', area: 'Mediterranean' },
    { yacht: 'TS Driftwood', role: 'First Officer', start: '2023-09-01', end: null, area: 'Caribbean' },
  ],
  Marcus: [
    { yacht: 'TS Artemis', role: 'Bosun', start: '2020-03-01', end: '2022-12-31', area: 'Mediterranean' },
    { yacht: 'TS Blue Horizon', role: 'Bosun', start: '2023-03-01', end: null, area: 'Caribbean' },
  ],
  Liam: [
    { yacht: 'TS Artemis', role: 'Lead Deckhand', start: '2021-04-01', end: '2022-10-31', area: 'Mediterranean' },
    { yacht: 'TS Blue Horizon', role: 'Lead Deckhand', start: '2023-03-01', end: '2024-10-31', area: 'Caribbean' },
    { yacht: 'TS Celestia', role: 'Lead Deckhand', start: '2025-01-01', end: null, area: 'Pacific' },
  ],
  Tyler: [
    { yacht: 'TS Blue Horizon', role: 'Deckhand', start: '2024-04-01', end: '2024-10-31', area: 'Mediterranean' },
    { yacht: 'TS Golden Reef', role: 'Deckhand', start: '2025-03-01', end: null, area: 'Caribbean' },
  ],
  Charlotte: [
    { yacht: 'TS Driftwood', role: 'Chief Stewardess', start: '2019-06-01', end: '2022-12-31', area: 'Mediterranean' },
    { yacht: 'TS Eclipse Star', role: 'Chief Stewardess', start: '2023-03-01', end: null, area: 'Worldwide' },
  ],
  Elena: [
    { yacht: 'TS Driftwood', role: 'Second Stewardess', start: '2021-04-01', end: '2023-06-30', area: 'Mediterranean' },
    { yacht: 'TS Artemis', role: 'Second Stewardess', start: '2023-09-01', end: null, area: 'Caribbean' },
  ],
  Mia: [
    { yacht: 'TS Blue Horizon', role: 'Stewardess', start: '2023-03-01', end: '2024-10-31', area: 'Mediterranean' },
    { yacht: 'TS Harbour Light', role: 'Stewardess', start: '2025-01-01', end: null, area: 'Southeast Asia' },
  ],
  Zara: [
    { yacht: 'TS Golden Reef', role: 'Stewardess', start: '2025-01-01', end: null, area: 'Caribbean' },
  ],
  Hannah: [
    { yacht: 'TS Harbour Light', role: 'Junior Stewardess', start: '2025-03-01', end: null, area: 'Southeast Asia' },
  ],
  David: [
    { yacht: 'TS Eclipse Star', role: 'Chief Engineer', start: '2018-01-01', end: '2022-12-31', area: 'Worldwide' },
    { yacht: 'TS Artemis', role: 'Chief Engineer', start: '2023-03-01', end: null, area: 'Mediterranean' },
  ],
  Ryan: [
    { yacht: 'TS Eclipse Star', role: 'Second Engineer', start: '2020-06-01', end: '2023-02-28', area: 'Worldwide' },
    { yacht: 'TS Driftwood', role: 'Second Engineer', start: '2023-09-01', end: null, area: 'Caribbean' },
  ],
  Kai: [
    { yacht: 'TS Eclipse Star', role: 'ETO', start: '2021-01-01', end: '2024-06-30', area: 'Worldwide' },
    { yacht: 'TS Iris', role: 'ETO', start: '2024-09-01', end: null, area: 'Mediterranean' },
  ],
  Pierre: [
    { yacht: 'TS Driftwood', role: 'Head Chef', start: '2019-06-01', end: '2022-12-31', area: 'Mediterranean' },
    { yacht: 'TS Eclipse Star', role: 'Head Chef', start: '2023-03-01', end: null, area: 'Worldwide' },
  ],
  Anna: [
    { yacht: 'TS Golden Reef', role: 'Sous Chef', start: '2023-04-01', end: '2024-10-31', area: 'Mediterranean' },
    { yacht: 'TS Iris', role: 'Sous Chef', start: '2025-01-01', end: null, area: 'Caribbean' },
  ],
  Jake: [
    { yacht: 'TS Blue Horizon', role: 'Crew Cook', start: '2023-03-01', end: '2024-10-31', area: 'Mediterranean' },
    { yacht: 'TS Celestia', role: 'Crew Cook', start: '2025-01-01', end: null, area: 'Pacific' },
  ],
  Sarah: [
    { yacht: 'TS Eclipse Star', role: 'Nurse', start: '2022-06-01', end: null, area: 'Worldwide' },
  ],
  Lucy: [
    { yacht: 'TS Driftwood', role: 'Nanny', start: '2023-09-01', end: null, area: 'Caribbean' },
  ],
  Tom: [
    { yacht: 'TS Blue Horizon', role: 'Dive Instructor', start: '2023-04-01', end: '2024-04-30', area: 'Caribbean' },
    { yacht: 'TS Celestia', role: 'Water Sports Lead', start: '2024-06-01', end: '2025-03-31', area: 'Pacific' },
    { yacht: 'TS Jade Wave', role: 'Dive Instructor', start: '2025-04-01', end: null, area: 'Maldives' },
  ],
  Olivia: [
    { yacht: 'TS Eclipse Star', role: 'Purser', start: '2020-01-01', end: '2024-06-30', area: 'Worldwide' },
    { yacht: 'TS Iris', role: 'Purser', start: '2024-09-01', end: null, area: 'Mediterranean' },
  ],
  Ben: [
    { yacht: 'TS Golden Reef', role: 'Deckhand', start: '2024-04-01', end: '2024-10-31', area: 'Mediterranean' },
    { yacht: 'TS Falcon III', role: 'Deckhand', start: '2025-01-01', end: null, area: 'Caribbean' },
  ],
  Chloe: [
    { yacht: 'TS Golden Reef', role: 'Third Stewardess', start: '2024-04-01', end: '2024-10-31', area: 'Mediterranean' },
    { yacht: 'TS Harbour Light', role: 'Third Stewardess', start: '2025-01-01', end: null, area: 'Southeast Asia' },
  ],
  Finn: [
    { yacht: 'TS Iris', role: 'Second Officer', start: '2023-06-01', end: '2024-12-31', area: 'Mediterranean' },
    { yacht: 'TS Falcon III', role: 'Second Officer', start: '2025-03-01', end: null, area: 'Caribbean' },
  ],
  Grace: [
    { yacht: 'TS Iris', role: 'Stewardess', start: '2024-01-01', end: '2024-12-31', area: 'Mediterranean' },
    { yacht: 'TS Jade Wave', role: 'Stewardess', start: '2025-04-01', end: null, area: 'Maldives' },
  ],
  Hugo: [
    { yacht: 'TS Falcon III', role: 'Engineer', start: '2024-04-01', end: '2024-12-31', area: 'Mediterranean' },
    { yacht: 'TS Harbour Light', role: 'Engineer', start: '2025-01-01', end: null, area: 'Southeast Asia' },
  ],
}

const GALLERY_SCENES = [
  { slug: 'deck-teak-work', label: 'Deck teak maintenance', kind: 'deck' },
  { slug: 'silver-service', label: 'Silver service setup', kind: 'interior' },
  { slug: 'sunset-stern', label: 'Sunset stern view', kind: 'sunset' },
  { slug: 'tender-driving', label: 'Tender driving', kind: 'tender' },
  { slug: 'galley-plating', label: 'Galley plating', kind: 'galley' },
  { slug: 'engine-room-rounds', label: 'Engine room rounds', kind: 'engine' },
  { slug: 'water-sports-launch', label: 'Water sports launch', kind: 'watersports' },
  { slug: 'guest-table-setting', label: 'Guest table setting', kind: 'tablescape' },
  { slug: 'bridge-watch', label: 'Bridge watch', kind: 'bridge' },
  { slug: 'beach-club-setup', label: 'Beach club setup', kind: 'beach' },
  { slug: 'provisioning-day', label: 'Provisioning day', kind: 'provisioning' },
  { slug: 'dockside-prep', label: 'Dockside prep', kind: 'dock' },
  { slug: 'dive-platform-kit', label: 'Dive platform kit', kind: 'dive' },
  { slug: 'sunrise-anchor-watch', label: 'Sunrise anchor watch', kind: 'sunrise' },
  { slug: 'sailing-bow-watch', label: 'Sailing bow watch', kind: 'sailing' },
  { slug: 'wine-service', label: 'Wine service', kind: 'interior' },
  { slug: 'crew-mess-lunch', label: 'Crew mess lunch', kind: 'galley' },
  { slug: 'night-bridge', label: 'Night bridge watch', kind: 'night-bridge' },
]

const PROFILE_PHOTO_COUNTS = {
  James: 2,
  Charlotte: 3,
  Olivia: 4,
}

const LANGUAGES_BY_COUNTRY = {
  'United Kingdom': [['English', 'Native'], ['Spanish', 'Conversational']],
  Bulgaria: [['Bulgarian', 'Native'], ['English', 'Fluent'], ['Russian', 'Conversational']],
  'South Africa': [['English', 'Native'], ['Afrikaans', 'Fluent']],
  Ireland: [['English', 'Native'], ['French', 'Conversational']],
  Australia: [['English', 'Native'], ['French', 'Conversational']],
  France: [['French', 'Native'], ['English', 'Fluent'], ['Italian', 'Conversational']],
  Italy: [['Italian', 'Native'], ['English', 'Fluent'], ['Spanish', 'Conversational']],
  Netherlands: [['Dutch', 'Native'], ['English', 'Fluent'], ['German', 'Conversational']],
  Nigeria: [['English', 'Native'], ['French', 'Conversational']],
  Germany: [['German', 'Native'], ['English', 'Fluent']],
  Poland: [['Polish', 'Native'], ['English', 'Fluent']],
  'New Zealand': [['English', 'Native'], ['Spanish', 'Conversational']],
  Japan: [['Japanese', 'Native'], ['English', 'Fluent']],
  Sweden: [['Swedish', 'Native'], ['English', 'Fluent']],
  'United States': [['English', 'Native'], ['Spanish', 'Conversational']],
  Spain: [['Spanish', 'Native'], ['English', 'Fluent']],
  Singapore: [['English', 'Fluent'], ['Mandarin', 'Native']],
  'South Korea': [['Korean', 'Native'], ['English', 'Fluent']],
}

const CERTS_BY_ROLE = {
  Captain: ['STCW BST', 'ENG1', 'Advanced Fire Fighting', 'PSCRB', 'Ship Security Officer', 'GMDSS GOC', 'VHF/SRC'],
  'First Officer': ['STCW BST', 'ENG1', 'Advanced Fire Fighting', 'PSCRB', 'Powerboat Level 2', 'VHF/SRC', 'GMDSS GOC'],
  Bosun: ['STCW BST', 'ENG1', 'Advanced Fire Fighting', 'Yacht Rating', 'Powerboat Level 2', 'Personal Watercraft'],
  'Lead Deckhand': ['STCW BST', 'ENG1', 'Yacht Rating', 'Powerboat Level 2', 'VHF/SRC', 'Personal Watercraft'],
  Deckhand: ['STCW BST', 'ENG1', 'Yacht Rating', 'Powerboat Level 2', 'Personal Watercraft'],
  'Chief Stewardess': ['STCW BST', 'ENG1', 'Food Safety Level 2', 'First Aid at Work', 'Powerboat Level 2'],
  'Second Stewardess': ['STCW BST', 'ENG1', 'Food Safety Level 2', 'First Aid at Work'],
  Stewardess: ['STCW BST', 'ENG1', 'Food Safety Level 2', 'First Aid at Work'],
  'Junior Stewardess': ['STCW BST', 'ENG1', 'Food Safety Level 2', 'First Aid at Work'],
  'Third Stewardess': ['STCW BST', 'ENG1', 'Food Safety Level 2', 'First Aid at Work'],
  'Chief Engineer': ['STCW BST', 'ENG1', 'Advanced Fire Fighting', 'PSCRB', 'Ship Security Officer', 'GMDSS GOC'],
  'Second Engineer': ['STCW BST', 'ENG1', 'Advanced Fire Fighting', 'PSCRB', 'VHF/SRC'],
  ETO: ['STCW BST', 'ENG1', 'Advanced Fire Fighting', 'PSCRB', 'GMDSS GOC'],
  Engineer: ['STCW BST', 'ENG1', 'Advanced Fire Fighting', 'PSCRB'],
  'Head Chef': ['STCW BST', 'ENG1', 'Food Safety Level 2', 'First Aid at Work', 'Advanced Fire Fighting'],
  'Sous Chef': ['STCW BST', 'ENG1', 'Food Safety Level 2', 'First Aid at Work'],
  'Crew Cook': ['STCW BST', 'ENG1', 'Food Safety Level 2', 'First Aid at Work'],
  Nurse: ['STCW BST', 'ENG1', 'Advanced Fire Fighting', 'PSCRB', 'First Aid at Work'],
  Nanny: ['STCW BST', 'ENG1', 'First Aid at Work', 'Food Safety Level 2'],
  'Dive Instructor': ['STCW BST', 'ENG1', 'First Aid at Work', 'Powerboat Level 2', 'Personal Watercraft'],
  Purser: ['STCW BST', 'ENG1', 'Ship Security Officer', 'First Aid at Work', 'VHF/SRC'],
}

const SKILLS_BY_DEPARTMENT = {
  Deck: ['Bridge watchkeeping', 'Tender driving', 'Line handling', 'Teak care', 'Water sports setup'],
  Interior: ['Silver service', 'Housekeeping detail', 'Laundry management', 'Table styling', 'Guest care'],
  Engineering: ['Planned maintenance', 'Electrical systems', 'HVAC', 'Watermakers', 'Engine troubleshooting'],
  Galley: ['Menu planning', 'Provisioning', 'Dietary requests', 'Food presentation', 'Crew meal planning'],
  Medical: ['Primary care', 'Medication control', 'Emergency response', 'Discretion', 'Guest support'],
  Other: ['Childcare routines', 'Water sports instruction', 'Activity planning', 'Guest engagement', 'Safety awareness'],
  Admin: ['Crew administration', 'Port logistics', 'Budget tracking', 'Clearance paperwork', 'Confidential coordination'],
}

const EDUCATION_BY_ROLE = {
  Captain: [
    ['Warsash Maritime Academy', 'Master (Yachts) 3000 GT', 'Navigation and command'],
    ['Southampton Solent University', 'Bridge Resource Management', 'Maritime operations'],
  ],
  'First Officer': [
    ['Maritime Professional Training, Fort Lauderdale', 'OOW 3000 GT', 'Deck operations'],
    ['Blackrock Further Education Institute', 'Bridge Team Management', 'Navigation systems'],
  ],
  Bosun: [
    ['UKSA', 'Deck Operations Programme', 'Deck and tender operations'],
    ['Superyacht Crew Academy', 'Bosun Leadership Workshop', 'Crew management'],
  ],
  'Lead Deckhand': [
    ['Bluewater Training', 'Deckhand Course', 'Tender and deck operations'],
    ['RYA Training Centre Antibes', 'Yachtmaster Offshore Theory', 'Navigation'],
  ],
  Deckhand: [
    ['Bluewater Training', 'Superyacht Deck Crew', 'Deck foundations'],
    ['RYA Training Centre', 'Powerboat & seamanship', 'Tender handling'],
  ],
  'Chief Stewardess': [
    ['The International Butler Academy', 'Silver Service & Housekeeping', 'Luxury service'],
    ['WSET', 'Level 2 Award in Wines', 'Wine service'],
  ],
  'Second Stewardess': [
    ['The Crew Academy', 'Advanced Interior Service', 'Guest service and laundry'],
    ['Cayman Crew Academy', 'Hospitality and housekeeping', 'Interior operations'],
  ],
  Stewardess: [
    ['The Crew Academy', 'Interior Introduction', 'Service and housekeeping'],
    ['Luxury Hospitality Institute', 'Guest service certificate', 'Service standards'],
  ],
  'Junior Stewardess': [
    ['The Crew Academy', 'Entry-Level Interior Course', 'Housekeeping and service'],
  ],
  'Third Stewardess': [
    ['The Crew Academy', 'Interior Crew Foundations', 'Housekeeping and laundry'],
  ],
  'Chief Engineer': [
    ['South Shields Marine School', 'Y4 Chief Engineer', 'Marine engineering'],
    ['MAN PrimeServ Academy', 'Engine systems familiarisation', 'Propulsion systems'],
  ],
  'Second Engineer': [
    ['Maritime Professional Training', 'AEC 1 & 2', 'Auxiliary engineering'],
    ['MTU Academy', 'Marine engine systems', 'Diagnostics'],
  ],
  ETO: [
    ['Maritime Professional Training', 'Electro-Technical Officer Course', 'Marine electronics'],
    ['Yokohama Institute of Technology', 'Electrical Engineering', 'Systems and controls'],
  ],
  Engineer: [
    ['Chalmers University of Technology', 'BSc Mechanical Engineering', 'Mechanical systems'],
    ['Maritime Professional Training', 'AEC', 'Marine auxiliary systems'],
  ],
  'Head Chef': [
    ['Le Cordon Bleu Paris', 'Diplome de Cuisine', 'Classical culinary arts'],
    ['Galley Gang', 'Superyacht Chef Business Course', 'Provisioning and galley systems'],
  ],
  'Sous Chef': [
    ['Stockholm Culinary Institute', 'Professional Cookery Diploma', 'Nordic cuisine'],
    ['Galley Gang', 'Superyacht Chef Intro', 'Galley workflow'],
  ],
  'Crew Cook': [
    ['Ashburton Chefs Academy', 'Diploma in Culinary Arts', 'Professional cookery'],
  ],
  Nurse: [
    ['University of Colorado', 'BSc Nursing', 'Adult nursing'],
    ['Remote Emergency Care', 'Maritime & remote medicine', 'Emergency response'],
  ],
  Nanny: [
    ['Melbourne Montessori Institute', 'Montessori Early Childhood', 'Child development'],
    ['Norland Online', 'Private household childcare', 'High-standard childcare'],
  ],
  'Dive Instructor': [
    ['PADI', 'Master Instructor', 'Dive education'],
    ['RYA Training Centre', 'Powerboat Level 2 Theory', 'Small craft handling'],
  ],
  Purser: [
    ['Purser Trainer', 'Superyacht Purser Diploma', 'Admin and financial management'],
    ['Singapore Management Institute', 'Business Administration', 'Operations'],
  ],
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function hashString(value) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createRng(seed) {
  let state = hashString(seed) || 1
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  }
}

function rgbToHex({ r, g, b }) {
  const toHex = (part) => clamp(Math.round(part), 0, 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function mixColor(a, b, t) {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  return rgbToHex({
    r: ca.r + (cb.r - ca.r) * t,
    g: ca.g + (cb.g - ca.g) * t,
    b: ca.b + (cb.b - ca.b) * t,
  })
}

class Raster {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.data = Buffer.alloc(width * height * 3, 255)
  }

  set(x, y, color, alpha = 1) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return
    const index = (Math.floor(y) * this.width + Math.floor(x)) * 3
    const base = { r: this.data[index], g: this.data[index + 1], b: this.data[index + 2] }
    const next = hexToRgb(color)
    this.data[index] = clamp(base.r + (next.r - base.r) * alpha, 0, 255)
    this.data[index + 1] = clamp(base.g + (next.g - base.g) * alpha, 0, 255)
    this.data[index + 2] = clamp(base.b + (next.b - base.b) * alpha, 0, 255)
  }

  fill(color) {
    const rgb = hexToRgb(color)
    for (let i = 0; i < this.data.length; i += 3) {
      this.data[i] = rgb.r
      this.data[i + 1] = rgb.g
      this.data[i + 2] = rgb.b
    }
  }

  verticalGradient(top, bottom) {
    for (let y = 0; y < this.height; y += 1) {
      const color = mixColor(top, bottom, y / Math.max(1, this.height - 1))
      for (let x = 0; x < this.width; x += 1) this.set(x, y, color)
    }
  }

  horizontalGradient(left, right) {
    for (let x = 0; x < this.width; x += 1) {
      const color = mixColor(left, right, x / Math.max(1, this.width - 1))
      for (let y = 0; y < this.height; y += 1) this.set(x, y, color)
    }
  }

  rect(x, y, width, height, color, alpha = 1) {
    const startX = Math.max(0, Math.floor(x))
    const startY = Math.max(0, Math.floor(y))
    const endX = Math.min(this.width, Math.ceil(x + width))
    const endY = Math.min(this.height, Math.ceil(y + height))
    for (let py = startY; py < endY; py += 1) {
      for (let px = startX; px < endX; px += 1) this.set(px, py, color, alpha)
    }
  }

  circle(cx, cy, radius, color, alpha = 1) {
    const minX = Math.max(0, Math.floor(cx - radius))
    const maxX = Math.min(this.width - 1, Math.ceil(cx + radius))
    const minY = Math.max(0, Math.floor(cy - radius))
    const maxY = Math.min(this.height - 1, Math.ceil(cy + radius))
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const dx = x - cx
        const dy = y - cy
        if ((dx * dx) + (dy * dy) <= radius * radius) this.set(x, y, color, alpha)
      }
    }
  }

  ellipse(cx, cy, rx, ry, color, alpha = 1) {
    const minX = Math.max(0, Math.floor(cx - rx))
    const maxX = Math.min(this.width - 1, Math.ceil(cx + rx))
    const minY = Math.max(0, Math.floor(cy - ry))
    const maxY = Math.min(this.height - 1, Math.ceil(cy + ry))
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const dx = (x - cx) / rx
        const dy = (y - cy) / ry
        if ((dx * dx) + (dy * dy) <= 1) this.set(x, y, color, alpha)
      }
    }
  }

  line(x1, y1, x2, y2, color, thickness = 1, alpha = 1) {
    const dx = x2 - x1
    const dy = y2 - y1
    const steps = Math.max(Math.abs(dx), Math.abs(dy), 1)
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps
      const x = x1 + dx * t
      const y = y1 + dy * t
      this.circle(x, y, thickness / 2, color, alpha)
    }
  }

  polygon(points, color, alpha = 1) {
    const ys = points.map((point) => point[1])
    const minY = Math.max(0, Math.floor(Math.min(...ys)))
    const maxY = Math.min(this.height - 1, Math.ceil(Math.max(...ys)))
    for (let y = minY; y <= maxY; y += 1) {
      const scan = y + 0.5
      const nodes = []
      for (let i = 0; i < points.length; i += 1) {
        const [x1, y1] = points[i]
        const [x2, y2] = points[(i + 1) % points.length]
        const crosses = (y1 < scan && y2 >= scan) || (y2 < scan && y1 >= scan)
        if (!crosses) continue
        const x = x1 + ((scan - y1) / (y2 - y1 || 1)) * (x2 - x1)
        nodes.push(x)
      }
      nodes.sort((a, b) => a - b)
      for (let i = 0; i < nodes.length; i += 2) {
        const startX = Math.max(0, Math.floor(nodes[i]))
        const endX = Math.min(this.width - 1, Math.ceil(nodes[i + 1] ?? nodes[i]))
        for (let x = startX; x <= endX; x += 1) this.set(x, y, color, alpha)
      }
    }
  }

  grain(amount, rng) {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const delta = (rng() - 0.5) * amount
        const index = (y * this.width + x) * 3
        this.data[index] = clamp(this.data[index] + delta, 0, 255)
        this.data[index + 1] = clamp(this.data[index + 1] + delta, 0, 255)
        this.data[index + 2] = clamp(this.data[index + 2] + delta, 0, 255)
      }
    }
  }

  vignette(strength = 0.22) {
    const cx = this.width / 2
    const cy = this.height / 2
    const maxDistance = Math.sqrt(cx * cx + cy * cy)
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const distance = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
        const factor = 1 - (distance / maxDistance) * strength
        const index = (y * this.width + x) * 3
        this.data[index] = clamp(this.data[index] * factor, 0, 255)
        this.data[index + 1] = clamp(this.data[index + 1] * factor, 0, 255)
        this.data[index + 2] = clamp(this.data[index + 2] * factor, 0, 255)
      }
    }
  }

  async writePpm(filePath) {
    const header = Buffer.from(`P6\n${this.width} ${this.height}\n255\n`)
    await fs.writeFile(filePath, Buffer.concat([header, this.data]))
  }
}

async function ensureDirectory(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function ensureAssetDirectories() {
  await ensureDirectory(ASSET_ROOT)
  await ensureDirectory(PROFILE_DIR)
  await ensureDirectory(GALLERY_DIR)
  await ensureDirectory(CV_DIR)
  await ensureDirectory(YACHT_DIR)
  await ensureDirectory(MANUAL_ROOT)
  await ensureDirectory(MANUAL_PROFILE_DIR)
  await ensureDirectory(MANUAL_GALLERY_DIR)
  await ensureDirectory(MANUAL_YACHT_DIR)
  await ensureDirectory(TEMP_DIR)
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function preserveOrCopyManualAsset(outputPath, manualPath) {
  if (!FORCE_REGENERATE && await fileExists(outputPath)) return true
  if (await fileExists(manualPath)) {
    await fs.copyFile(manualPath, outputPath)
    return true
  }
  return false
}

function getYacht(name) {
  const yacht = YACHTS.find((item) => item.name === name)
  if (!yacht) throw new Error(`Unknown yacht: ${name}`)
  return yacht
}

function calculateAge(dob) {
  const birthday = new Date(dob)
  const asOf = new Date(AS_OF_DATE)
  let age = asOf.getUTCFullYear() - birthday.getUTCFullYear()
  const beforeBirthday = (asOf.getUTCMonth() < birthday.getUTCMonth()) ||
    (asOf.getUTCMonth() === birthday.getUTCMonth() && asOf.getUTCDate() < birthday.getUTCDate())
  if (beforeBirthday) age -= 1
  return age
}

function formatDate(date, style = 'clean') {
  if (!date) return 'Present'
  const parsed = new Date(date)
  const month = parsed.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
  const monthLong = parsed.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })
  const year = parsed.getUTCFullYear()
  if (style === 'alt') return `${String(parsed.getUTCMonth() + 1).padStart(2, '0')}/${year}`
  if (style === 'year') return `${year}`
  if (style === 'long') return `${monthLong} ${year}`
  return `${month} ${year}`
}

function dateRange(start, end, style = 'clean') {
  return `${formatDate(start, style)} - ${end ? formatDate(end, style) : 'Present'}`
}

function makePhone(user) {
  const codeByCountry = {
    'United Kingdom': '+44',
    Bulgaria: '+359',
    'South Africa': '+27',
    Ireland: '+353',
    Australia: '+61',
    France: '+33',
    Italy: '+39',
    Netherlands: '+31',
    Nigeria: '+234',
    Germany: '+49',
    Poland: '+48',
    'New Zealand': '+64',
    Japan: '+81',
    Sweden: '+46',
    'United States': '+1',
    Spain: '+34',
    Singapore: '+65',
    'South Korea': '+82',
  }
  const code = codeByCountry[user.nationality] || '+44'
  const rng = createRng(`${user.first}-phone`)
  const groups = Array.from({ length: 3 }, () => String(Math.floor(100 + rng() * 900)))
  return `${code} ${groups.join(' ')}`
}

function makeEmail(user) {
  const first = slugify(user.first)
  const last = slugify(user.last)
  return `test-seed-${first}-${last}@yachtie.link`
}

function buildBio(user, assignments) {
  const currentYacht = assignments[assignments.length - 1]
  const age = calculateAge(user.dob)
  const yearsAtSea = Math.max(2, new Date(AS_OF_DATE).getUTCFullYear() - new Date(assignments[0].start).getUTCFullYear())
  const departmentLine = {
    Deck: `${user.role} with ${yearsAtSea}+ years across private and charter programmes, confident in bridge routines, deck standards, and calm crew leadership.`,
    Interior: `${user.role} with a polished luxury-service style, strong housekeeping discipline, and a warm, discreet approach to guest care.`,
    Engineering: `${user.role} with a practical systems mindset, tidy maintenance habits, and experience supporting smooth technical operations on busy programmes.`,
    Galley: `${user.role} bringing structured galley organisation, adaptable menus, and steady service under guest and crew pressure.`,
    Medical: `${user.role} with a calm bedside manner, tidy medical admin, and a preventative approach to onboard wellbeing.`,
    Other: `${user.role} with a flexible guest-facing style, strong situational awareness, and a reassuring presence for families and activity-led trips.`,
    Admin: `${user.role} experienced in high-standard administration, discreet communication, and keeping fast-moving yacht operations organised.`,
  }[user.department]

  const closing = `Currently onboard ${currentYacht.yacht}, ${user.first} is looking to represent a realistic ${age}-year-old ${user.role.toLowerCase()} profile for parser and presentation testing.`
  return `${departmentLine} ${closing}`
}

function getLanguages(user) {
  return LANGUAGES_BY_COUNTRY[user.nationality] || [['English', 'Fluent']]
}

function getEducation(user) {
  return EDUCATION_BY_ROLE[user.role] || [['Bluewater Training', 'Superyacht Introduction', 'Crew foundations']]
}

function getSkills(user) {
  const skills = SKILLS_BY_DEPARTMENT[user.department] || ['Teamwork', 'Guest focus', 'Time management']
  return skills.slice(0, 5)
}

function getCertifications(user) {
  return CERTS_BY_ROLE[user.role] || ['STCW BST', 'ENG1', 'First Aid at Work', 'Powerboat Level 2']
}

function getTemplateVariant(user) {
  if (user.template === 'clean') return { dateStyle: 'clean', sectionOrder: ['summary', 'skills', 'experience', 'education'], headingTone: 'formal' }
  if (user.template === 'alternate') return { dateStyle: 'alt', sectionOrder: ['summary', 'experience', 'skills', 'education'], headingTone: 'mixed' }
  const variants = ['clean', 'alt', 'long', 'year']
  const rng = createRng(`${user.first}-${user.last}-template`)
  return {
    dateStyle: variants[Math.floor(rng() * variants.length)],
    sectionOrder: ['experience', 'summary', 'education', 'skills'],
    headingTone: 'messy',
  }
}

function buildStructuredUser(user) {
  const assignments = ASSIGNMENTS[user.first].map((assignment) => {
    const yacht = getYacht(assignment.yacht)
    return {
      ...assignment,
      yachtType: yacht.yachtType,
      lengthMeters: yacht.lengthMeters,
      builder: yacht.builder,
      flagState: yacht.flagState,
    }
  })
  const handle = `test-seed-${slugify(user.first)}`
  const photoCount = PROFILE_PHOTO_COUNTS[user.first] || 1
  const profilePhotos = Array.from({ length: photoCount }, (_, index) =>
    index === 0 ? `${slugify(user.first)}.jpg` : `${slugify(user.first)}-${index + 1}.jpg`,
  )
  return {
    ...user,
    handle,
    email: makeEmail(user),
    phone: makePhone(user),
    age: calculateAge(user.dob),
    assignments,
    bio: buildBio(user, assignments),
    languages: getLanguages(user),
    certifications: getCertifications(user),
    education: getEducation(user),
    skills: getSkills(user),
    profileFilename: profilePhotos[0],
    profilePhotos,
    cvFilename: `${handle}-${slugify(user.last)}-cv.pdf`,
  }
}

function drawPortrait(canvas, user, variantIndex = 0) {
  const { portrait } = user
  const rng = createRng(`${user.first}-${user.last}-portrait-${variantIndex}`)
  const backdropBase = variantIndex === 0 ? portrait.backdrop : mixColor(portrait.backdrop, portrait.accent, 0.18 * variantIndex)
  const accentBase = variantIndex === 0 ? portrait.accent : mixColor(portrait.accent, '#ffffff', 0.12 * (variantIndex % 3))
  const shirtBase = variantIndex === 0 ? portrait.shirt : mixColor(portrait.shirt, portrait.accent, 0.16 * variantIndex)
  canvas.verticalGradient(backdropBase, mixColor(backdropBase, accentBase, 0.45))
  for (let i = 0; i < 14; i += 1) {
    canvas.circle(40 + rng() * 340, 30 + rng() * 180, 18 + rng() * 44, '#ffffff', 0.07 + rng() * 0.06)
  }
  canvas.ellipse(200, 405, 180, 110, mixColor(shirtBase, '#ffffff', 0.08), 1)
  canvas.rect(150, 228, 100, 120, shirtBase, 1)
  canvas.polygon([[120, 240], [280, 240], [330, 398], [70, 398]], shirtBase, 1)
  canvas.rect(175, 190, 50, 38, mixColor(portrait.skin, '#ffffff', 0.05), 1)
  canvas.circle(200, 150, 82, portrait.skin, 1)
  canvas.circle(126, 152, 13, portrait.skin, 1)
  canvas.circle(274, 152, 13, portrait.skin, 1)

  if (portrait.style === 'short' || portrait.style === 'fade' || portrait.style === 'wave' || portrait.style === 'chef') {
    canvas.ellipse(200, 98, 88, 54, portrait.hair, 1)
    canvas.rect(118, 96, 164, 46, portrait.hair, 1)
  }
  if (portrait.style === 'fade') canvas.rect(118, 96, 164, 34, portrait.hair, 1)
  if (portrait.style === 'wave') {
    canvas.ellipse(200, 104, 92, 58, portrait.hair, 1)
    canvas.circle(146, 112, 22, portrait.hair, 1)
    canvas.circle(254, 112, 22, portrait.hair, 1)
  }
  if (portrait.style === 'bun') {
    canvas.circle(200, 48, 26, portrait.hair, 1)
    canvas.ellipse(200, 104, 90, 58, portrait.hair, 1)
    canvas.rect(118, 102, 164, 46, portrait.hair, 1)
  }
  if (portrait.style === 'long' || portrait.style === 'chef-long') {
    canvas.ellipse(200, 106, 92, 62, portrait.hair, 1)
    canvas.rect(120, 104, 160, 122, portrait.hair, 1)
  }
  if (portrait.style === 'bob') {
    canvas.ellipse(200, 106, 88, 62, portrait.hair, 1)
    canvas.rect(124, 104, 152, 84, portrait.hair, 1)
  }
  if (portrait.style === 'pony') {
    canvas.ellipse(200, 108, 88, 60, portrait.hair, 1)
    canvas.rect(122, 104, 156, 64, portrait.hair, 1)
    canvas.line(252, 140, 284, 220, portrait.hair, 16, 1)
  }
  if (portrait.style === 'curly') {
    for (let i = 0; i < 16; i += 1) {
      canvas.circle(124 + rng() * 152, 72 + rng() * 96, 18 + rng() * 16, portrait.hair, 1)
    }
  }
  if (portrait.style === 'chef' || portrait.style === 'chef-long') {
    canvas.rect(122, 52, 156, 20, '#ffffff', 1)
    canvas.circle(138, 58, 20, '#ffffff', 1)
    canvas.circle(182, 46, 24, '#ffffff', 1)
    canvas.circle(222, 46, 24, '#ffffff', 1)
    canvas.circle(262, 58, 20, '#ffffff', 1)
  }

  canvas.ellipse(168, 154, 10, 7, '#2a211f', 1)
  canvas.ellipse(232, 154, 10, 7, '#2a211f', 1)
  canvas.circle(168, 154, 3, '#ffffff', 0.6)
  canvas.circle(232, 154, 3, '#ffffff', 0.6)
  canvas.line(200, 158, 196, 184, '#9b6d56', 2, 0.65)
  canvas.line(196, 184, 206, 186, '#9b6d56', 2, 0.65)
  canvas.line(166, 214, 200, 224, '#974f57', 4, 0.95)
  canvas.line(200, 224, 234, 214, '#974f57', 4, 0.95)

  canvas.line(112, 264, 188, 318, mixColor(shirtBase, '#ffffff', 0.16), 18, 1)
  canvas.line(288, 264, 212, 318, mixColor(shirtBase, '#ffffff', 0.16), 18, 1)
  canvas.ellipse(200, 304, 28, 18, '#f7f2ef', 1)

  if (variantIndex > 0) {
    canvas.line(116, 286, 284, 286, mixColor(accentBase, '#ffffff', 0.1), 8, 0.9)
    if (variantIndex % 2 === 0) {
      canvas.line(156, 334, 244, 334, mixColor(accentBase, '#ffffff', 0.2), 10, 0.85)
    }
    if (variantIndex >= 2) {
      canvas.circle(278, 178, 8, accentBase, 0.85)
      canvas.circle(290, 178, 8, accentBase, 0.65)
    }
  }

  if (portrait.ageBand === 'senior') {
    canvas.line(150, 144, 172, 146, '#8f6e63', 2, 0.35)
    canvas.line(228, 146, 250, 144, '#8f6e63', 2, 0.35)
    canvas.line(170, 228, 200, 236, '#8f6e63', 2, 0.25)
    canvas.line(200, 236, 230, 228, '#8f6e63', 2, 0.25)
  }

  canvas.line(68, 330, 332, 330, accentBase, 6, 0.25)
  canvas.grain(8, rng)
  canvas.vignette(0.18)
}

function drawSkyAndSea(canvas, top, horizon, bottom) {
  for (let y = 0; y < canvas.height; y += 1) {
    const isSky = y < canvas.height * 0.58
    const t = isSky
      ? y / (canvas.height * 0.58)
      : (y - canvas.height * 0.58) / (canvas.height * 0.42)
    const color = isSky ? mixColor(top, horizon, t) : mixColor(horizon, bottom, t)
    for (let x = 0; x < canvas.width; x += 1) canvas.set(x, y, color)
  }
}

function drawSun(canvas, x, y, radius, color) {
  canvas.circle(x, y, radius, color, 0.95)
  canvas.circle(x, y, radius * 1.6, color, 0.18)
}

function drawMotorYacht(canvas, x, y, scale, hullColor, superColor) {
  const hull = [
    [x, y],
    [x + scale * 1.2, y - scale * 0.08],
    [x + scale * 1.9, y - scale * 0.02],
    [x + scale * 2.05, y + scale * 0.12],
    [x + scale * 0.2, y + scale * 0.18],
  ]
  canvas.polygon(hull, hullColor, 1)
  canvas.rect(x + scale * 0.34, y - scale * 0.34, scale * 0.92, scale * 0.22, superColor, 1)
  canvas.rect(x + scale * 0.64, y - scale * 0.54, scale * 0.56, scale * 0.16, superColor, 1)
  canvas.rect(x + scale * 1.2, y - scale * 0.58, scale * 0.16, scale * 0.05, mixColor(superColor, '#d6eaf3', 0.25), 1)
  canvas.line(x + scale * 0.4, y + scale * 0.19, x + scale * 1.92, y + scale * 0.14, '#ffffff', 2, 0.22)
  for (let i = 0; i < 4; i += 1) {
    canvas.rect(x + scale * (0.42 + i * 0.16), y - scale * 0.27, scale * 0.08, scale * 0.05, '#8dc5e2', 0.9)
  }
}

function drawSailingYacht(canvas, x, y, scale, hullColor, sailColor) {
  canvas.polygon([
    [x, y],
    [x + scale * 1.4, y - scale * 0.06],
    [x + scale * 1.84, y + scale * 0.1],
    [x + scale * 0.2, y + scale * 0.18],
  ], hullColor, 1)
  canvas.line(x + scale * 0.98, y - scale * 0.98, x + scale * 1.02, y - scale * 0.06, '#dddfe2', 6, 1)
  canvas.polygon([
    [x + scale * 1.02, y - scale * 0.96],
    [x + scale * 1.02, y - scale * 0.12],
    [x + scale * 0.44, y - scale * 0.18],
  ], sailColor, 1)
  canvas.polygon([
    [x + scale * 1.04, y - scale * 0.72],
    [x + scale * 1.04, y - scale * 0.08],
    [x + scale * 1.46, y - scale * 0.12],
  ], mixColor(sailColor, '#ffffff', 0.12), 1)
}

function drawWaterLine(canvas, y, color, alpha = 0.25) {
  for (let i = 0; i < 16; i += 1) {
    canvas.line(0, y + i * 18, canvas.width, y + i * 18 + 12, color, 3, alpha)
  }
}

function drawYachtCover(canvas, yacht) {
  const [warm, sky, sea] = yacht.coverPalette
  const rng = createRng(`${yacht.slug}-cover`)
  drawSkyAndSea(canvas, mixColor(sky, '#ffffff', 0.25), sky, sea)
  drawSun(canvas, canvas.width * (0.22 + rng() * 0.2), canvas.height * 0.18, 68, warm)
  drawWaterLine(canvas, canvas.height * 0.62, '#ffffff', 0.14)
  if (yacht.yachtType === 'Sailing Yacht') {
    drawSailingYacht(canvas, canvas.width * 0.26, canvas.height * 0.62, canvas.width * 0.24, '#f4f1eb', '#f9f6f0')
  } else {
    drawMotorYacht(canvas, canvas.width * 0.18, canvas.height * 0.62, canvas.width * (0.18 + yacht.lengthMeters / 700), '#f8f5ef', '#fdfdfc')
  }
  canvas.polygon([
    [0, canvas.height * 0.7],
    [canvas.width * 0.18, canvas.height * 0.58],
    [canvas.width * 0.28, canvas.height * 0.72],
    [0, canvas.height],
  ], mixColor(sea, '#193340', 0.28), 0.35)
  canvas.grain(10, rng)
  canvas.vignette(0.14)
}

function drawCrewScene(canvas, scene) {
  const rng = createRng(scene.slug)
  const palettes = {
    deck: ['#dff1f1', '#8dc3d0', '#2e6574'],
    interior: ['#f9efe8', '#d5b091', '#6f5a55'],
    sunset: ['#f6c78d', '#d0875a', '#2b546a'],
    tender: ['#dff2f4', '#93cad7', '#2f6979'],
    galley: ['#f4ede6', '#c8936b', '#6d584a'],
    engine: ['#dce3e8', '#8599ab', '#425361'],
    watersports: ['#d6f0f4', '#66b5c7', '#2d6a77'],
    tablescape: ['#f8efe7', '#d5a98b', '#7d645d'],
    bridge: ['#ddeaf2', '#8fb4cc', '#36566e'],
    beach: ['#f5e1b6', '#7bc0ca', '#2b6370'],
    provisioning: ['#e9e1d8', '#c19a73', '#6b574c'],
    dock: ['#e2ecef', '#8fb6c7', '#426170'],
    dive: ['#d5eef2', '#78b8c4', '#286874'],
    sunrise: ['#f3c38d', '#f0dfc3', '#2a6172'],
    sailing: ['#dff1f5', '#87b8ce', '#31586c'],
    'night-bridge': ['#142738', '#30526a', '#0d1f2b'],
  }
  const [top, middle, bottom] = palettes[scene.kind] || palettes.deck
  drawSkyAndSea(canvas, top, middle, bottom)
  drawWaterLine(canvas, canvas.height * 0.68, '#ffffff', 0.12)
  drawSun(canvas, canvas.width * (0.18 + rng() * 0.55), canvas.height * 0.18, scene.kind === 'night-bridge' ? 30 : 54, scene.kind === 'night-bridge' ? '#d8ddf0' : '#ffd49f')

  if (scene.kind === 'interior' || scene.kind === 'tablescape') {
    canvas.rect(160, 260, 1280, 500, '#f8f6f1', 1)
    canvas.rect(0, 620, canvas.width, 280, '#c3a382', 1)
    canvas.rect(320, 500, 960, 48, '#d3b28e', 1)
    for (let i = 0; i < 5; i += 1) {
      canvas.circle(480 + i * 180, 480, 34, '#ffffff', 1)
      canvas.circle(480 + i * 180, 480, 18, '#d6d2cc', 1)
      canvas.rect(448 + i * 180, 440, 64, 10, '#f2d8c7', 1)
    }
    canvas.circle(1180, 420, 42, '#c19f62', 1)
    canvas.rect(1130, 436, 100, 12, '#6a7b62', 1)
  } else if (scene.kind === 'galley') {
    canvas.rect(0, 600, canvas.width, 300, '#b09072', 1)
    canvas.rect(210, 300, 1180, 280, '#ece5db', 1)
    for (let i = 0; i < 4; i += 1) canvas.circle(420 + i * 220, 430, 56, '#ffffff', 1)
    canvas.circle(420, 430, 20, '#88aa67', 1)
    canvas.circle(640, 430, 18, '#db8a55', 1)
    canvas.circle(860, 430, 20, '#a56342', 1)
  } else if (scene.kind === 'engine') {
    canvas.rect(0, 440, canvas.width, 460, '#566b7b', 1)
    for (let i = 0; i < 8; i += 1) canvas.rect(120 + i * 160, 360, 96, 320, '#748797', 1)
    canvas.rect(280, 510, 1040, 90, '#9eacb5', 1)
    canvas.line(0, 690, canvas.width, 690, '#ffcb55', 8, 1)
  } else if (scene.kind === 'tender') {
    drawMotorYacht(canvas, 450, 560, 170, '#ffffff', '#fbfbfb')
    canvas.polygon([[960, 690], [1140, 636], [1220, 684], [1000, 736]], '#2d5d6d', 1)
  } else if (scene.kind === 'sailing') {
    drawSailingYacht(canvas, 520, 610, 280, '#f8f4ef', '#fefcf8')
  } else {
    drawMotorYacht(canvas, 430, 610, 220, '#fbf7f1', '#ffffff')
  }

  const personColor = scene.kind === 'engine' ? '#f0ba61' : '#ffffff'
  canvas.circle(280, 460, 38, '#dcb393', 1)
  canvas.line(280, 500, 280, 620, personColor, 34, 1)
  canvas.line(280, 530, 220, 600, personColor, 16, 1)
  canvas.line(280, 530, 342, 606, personColor, 16, 1)
  canvas.line(280, 620, 230, 740, '#38596c', 18, 1)
  canvas.line(280, 620, 326, 740, '#38596c', 18, 1)

  canvas.grain(10, rng)
  canvas.vignette(0.16)
}

async function writeRasterAsJpeg(raster, outputPath, tempName) {
  const ppmPath = path.join(TEMP_DIR, `${tempName}.ppm`)
  await raster.writePpm(ppmPath)
  execFileSync('sips', ['-s', 'format', 'jpeg', ppmPath, '--out', outputPath], { stdio: 'ignore' })
}

async function generateImages(users) {
  for (const yacht of YACHTS) {
    const outputPath = path.join(YACHT_DIR, `${yacht.slug}.jpg`)
    if (await preserveOrCopyManualAsset(outputPath, path.join(MANUAL_YACHT_DIR, `${yacht.slug}.jpg`))) continue
    const canvas = new Raster(1600, 900)
    drawYachtCover(canvas, yacht)
    await writeRasterAsJpeg(canvas, outputPath, `yacht-${yacht.slug}`)
  }

  for (const scene of GALLERY_SCENES) {
    const outputPath = path.join(GALLERY_DIR, `${scene.slug}.jpg`)
    if (await preserveOrCopyManualAsset(outputPath, path.join(MANUAL_GALLERY_DIR, `${scene.slug}.jpg`))) continue
    const canvas = new Raster(1600, 900)
    drawCrewScene(canvas, scene)
    await writeRasterAsJpeg(canvas, outputPath, `gallery-${scene.slug}`)
  }

  for (const user of users) {
    for (let index = 0; index < user.profilePhotos.length; index += 1) {
      const filename = user.profilePhotos[index]
      const outputPath = path.join(PROFILE_DIR, filename)
      if (await preserveOrCopyManualAsset(outputPath, path.join(MANUAL_PROFILE_DIR, filename))) continue
      const canvas = new Raster(400, 400)
      drawPortrait(canvas, user, index)
      await writeRasterAsJpeg(
        canvas,
        outputPath,
        `profile-${user.handle}-${index + 1}`,
      )
    }
  }
}

async function imageToDataUrl(filePath) {
  const buffer = await fs.readFile(filePath)
  return `data:image/jpeg;base64,${buffer.toString('base64')}`
}

const pdfStyles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: '#24333f', backgroundColor: '#ffffff' },
  row: { flexDirection: 'row' },
  sidebar: { width: '33%', padding: 20, backgroundColor: '#f5f0eb', borderRightWidth: 1, borderRightColor: '#e4d8cd' },
  sidebarAlt: { width: '33%', padding: 20, backgroundColor: '#edf2f4', borderRightWidth: 1, borderRightColor: '#d8e0e4' },
  sidebarMessy: { width: '33%', padding: 18, backgroundColor: '#f2ede6', borderRightWidth: 1, borderRightColor: '#e0d4c8' },
  main: { width: '67%', padding: 24 },
  photo: { width: 120, height: 120, borderRadius: 12, marginBottom: 14, objectFit: 'cover' },
  title: { fontSize: 26, fontWeight: 700, marginBottom: 2, color: '#274a56' },
  titleAlt: { fontSize: 24, fontWeight: 700, marginBottom: 4, color: '#465d73' },
  role: { fontSize: 14, marginBottom: 12, color: '#6b7d86' },
  heading: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 7, color: '#7b6559' },
  headingAlt: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7, color: '#5e7282' },
  paragraph: { fontSize: 10, lineHeight: 1.45, marginBottom: 8, color: '#314553' },
  metaLine: { fontSize: 9.5, lineHeight: 1.5, marginBottom: 3, color: '#455864' },
  listItem: { fontSize: 9.5, lineHeight: 1.45, marginBottom: 4, color: '#364955' },
  section: { marginBottom: 14 },
  jobCard: { marginBottom: 10, paddingBottom: 8, borderBottomWidth: 0.8, borderBottomColor: '#e2d7cc' },
  jobTitle: { fontSize: 10.5, fontWeight: 700, marginBottom: 2, color: '#263845' },
  subtle: { fontSize: 8.6, color: '#74838d', marginBottom: 2 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: { fontSize: 8.8, paddingVertical: 3, paddingHorizontal: 7, borderRadius: 999, backgroundColor: '#f0e3d5', color: '#6b584f', marginRight: 4, marginBottom: 4 },
  chipAlt: { fontSize: 8.8, paddingVertical: 3, paddingHorizontal: 7, borderRadius: 999, backgroundColor: '#e1ebf1', color: '#546877', marginRight: 4, marginBottom: 4 },
  pageBreakHeading: { fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#274a56' },
  footerLine: { fontSize: 8.5, color: '#7a868e', marginTop: 8 },
  detailsTableRow: { flexDirection: 'row', borderBottomWidth: 0.6, borderBottomColor: '#d9e0e4', paddingVertical: 5 },
  detailsLabel: { width: '36%', fontSize: 9, color: '#6b7a85' },
  detailsValue: { width: '64%', fontSize: 9.3, color: '#304452' },
})

function skillChips(items, alt = false) {
  return h(View, { style: pdfStyles.chipWrap }, ...items.map((item) => h(Text, { key: item, style: alt ? pdfStyles.chipAlt : pdfStyles.chip }, item)))
}

function renderEmploymentRows(user, variant) {
  return user.assignments.map((item, index) =>
    h(View, { key: `${item.yacht}-${item.start}-${index}`, style: pdfStyles.jobCard },
      h(Text, { style: pdfStyles.jobTitle }, `${item.yacht} | ${item.role}`),
      h(Text, { style: pdfStyles.subtle }, `${item.yachtType}, ${item.lengthMeters}m, ${item.builder}, ${item.flagState}`),
      h(Text, { style: pdfStyles.subtle }, `${dateRange(item.start, item.end, variant.dateStyle)} | Cruising area: ${item.area}`),
      h(Text, { style: pdfStyles.paragraph }, buildEmploymentSentence(user, item)),
    ),
  )
}

function buildEmploymentSentence(user, item) {
  const departmentNotes = {
    Deck: 'Supported safe deck operations, bridge assistance, tender logistics, and polished exterior standards.',
    Interior: 'Delivered guest-facing service, housekeeping detail, turn-downs, and smooth day-to-day cabin operations.',
    Engineering: 'Handled preventative maintenance, technical checks, and calm fault response across core onboard systems.',
    Galley: 'Managed provisioning, galley hygiene, dietary requests, and consistent service under changing guest plans.',
    Medical: 'Maintained medical readiness, private guest care, and preventative onboard wellbeing support.',
    Other: 'Provided trusted guest support, activity planning, and flexible day-to-day coverage depending on programme needs.',
    Admin: 'Oversaw admin flow, itinerary support, crew paperwork, and precise communication with agents and suppliers.',
  }
  return departmentNotes[user.department]
}

function renderEducationRows(user, variant) {
  return user.education.map((item, index) =>
    h(View, { key: `${item[0]}-${index}`, style: pdfStyles.jobCard },
      h(Text, { style: pdfStyles.jobTitle }, item[1]),
      h(Text, { style: pdfStyles.subtle }, item[0]),
      h(Text, { style: pdfStyles.paragraph }, item[2] || `Relevant training for ${user.role.toLowerCase()} pathways.`),
      variant.headingTone === 'messy' ? h(Text, { style: pdfStyles.subtle }, index === 0 ? 'Completed' : 'Further training') : null,
    ),
  )
}

function renderCertificates(user, variant) {
  return user.certifications.map((cert, index) => {
    const expiryYear = 2027 + ((index + user.age) % 3)
    return h(Text, { key: cert, style: pdfStyles.listItem }, `${cert}${variant.headingTone === 'messy' && index % 2 === 0 ? '' : ` | Exp. ${expiryYear}`}`)
  })
}

function renderLanguages(user, variant) {
  return user.languages.map(([language, level]) => h(Text, { key: language, style: pdfStyles.listItem }, variant.headingTone === 'messy' ? `${language} - ${level}` : `${language} (${level})`))
}

function cleanCvDocument(user, photoDataUrl) {
  const variant = getTemplateVariant(user)
  return h(Document, null,
    h(Page, { size: 'A4', style: pdfStyles.page },
      h(View, { style: pdfStyles.row },
        h(View, { style: pdfStyles.sidebar },
          h(Image, { src: photoDataUrl, style: pdfStyles.photo }),
          h(View, { style: pdfStyles.section },
            h(Text, { style: pdfStyles.heading }, 'Details'),
            h(Text, { style: pdfStyles.metaLine }, `${user.nationality}`),
            h(Text, { style: pdfStyles.metaLine }, `DOB ${user.dob}`),
            h(Text, { style: pdfStyles.metaLine }, `Phone ${user.phone}`),
            h(Text, { style: pdfStyles.metaLine }, user.email),
            h(Text, { style: pdfStyles.metaLine }, `Handle ${user.handle}`),
          ),
          h(View, { style: pdfStyles.section },
            h(Text, { style: pdfStyles.heading }, 'Certificates'),
            ...renderCertificates(user, variant),
          ),
          h(View, { style: pdfStyles.section },
            h(Text, { style: pdfStyles.heading }, 'Languages'),
            ...renderLanguages(user, variant),
          ),
        ),
        h(View, { style: pdfStyles.main },
          h(Text, { style: pdfStyles.title }, `${user.first} ${user.last}`),
          h(Text, { style: pdfStyles.role }, user.role),
          h(View, { style: pdfStyles.section },
            h(Text, { style: pdfStyles.heading }, 'Profile'),
            h(Text, { style: pdfStyles.paragraph }, user.bio),
          ),
          h(View, { style: pdfStyles.section },
            h(Text, { style: pdfStyles.heading }, 'Skills'),
            skillChips(user.skills, false),
          ),
          h(View, { style: pdfStyles.section },
            h(Text, { style: pdfStyles.heading }, 'Employment History'),
            ...renderEmploymentRows(user, variant),
          ),
        ),
      ),
    ),
    h(Page, { size: 'A4', style: [pdfStyles.page, { padding: 28 }] },
      h(Text, { style: pdfStyles.pageBreakHeading }, 'Education & Additional Notes'),
      ...renderEducationRows(user, variant),
      h(View, { style: pdfStyles.section },
        h(Text, { style: pdfStyles.heading }, 'Operational Highlights'),
        h(Text, { style: pdfStyles.paragraph }, `${user.first} is seeded as a realistic ${user.role.toLowerCase()} profile for CV parser testing. All yacht names are tagged with TS prefixes and all handles use the test-seed format for clean removal later.`),
      ),
      h(Text, { style: pdfStyles.footerLine }, 'References available on request | Test Seed CV Pack'),
    ),
  )
}

function alternateCvDocument(user, photoDataUrl) {
  const variant = getTemplateVariant(user)
  return h(Document, null,
    h(Page, { size: 'A4', style: pdfStyles.page },
      h(View, { style: pdfStyles.row },
        h(View, { style: pdfStyles.sidebarAlt },
          h(Image, { src: photoDataUrl, style: pdfStyles.photo }),
          h(View, { style: pdfStyles.section },
            h(Text, { style: pdfStyles.headingAlt }, 'At A Glance'),
            h(Text, { style: pdfStyles.metaLine }, `${user.nationality} | Age ${user.age}`),
            h(Text, { style: pdfStyles.metaLine }, user.phone),
            h(Text, { style: pdfStyles.metaLine }, user.email),
          ),
          h(View, { style: pdfStyles.section },
            h(Text, { style: pdfStyles.headingAlt }, 'Key Certifications'),
            ...renderCertificates(user, variant),
          ),
        ),
        h(View, { style: pdfStyles.main },
          h(Text, { style: pdfStyles.titleAlt }, `${user.first} ${user.last}`),
          h(Text, { style: pdfStyles.role }, user.role),
          h(View, { style: pdfStyles.section },
            h(Text, { style: pdfStyles.headingAlt }, 'Professional Profile'),
            h(Text, { style: pdfStyles.paragraph }, user.bio),
          ),
          h(View, { style: pdfStyles.section },
            h(Text, { style: pdfStyles.headingAlt }, 'Core Skills'),
            skillChips(user.skills, true),
          ),
          h(View, { style: pdfStyles.section },
            h(Text, { style: pdfStyles.headingAlt }, 'Details Table'),
            ...[
              ['Nationality', user.nationality],
              ['Date of Birth', user.dob],
              ['Languages', user.languages.map(([language]) => language).join(', ')],
              ['Current Role', user.role],
            ].map(([label, value]) =>
              h(View, { key: label, style: pdfStyles.detailsTableRow },
                h(Text, { style: pdfStyles.detailsLabel }, label),
                h(Text, { style: pdfStyles.detailsValue }, value),
              ),
            ),
          ),
        ),
      ),
    ),
    h(Page, { size: 'A4', style: [pdfStyles.page, { padding: 28 }] },
      h(Text, { style: pdfStyles.pageBreakHeading }, 'Employment & Education'),
      ...renderEmploymentRows(user, variant),
      h(View, { style: pdfStyles.section },
        h(Text, { style: pdfStyles.headingAlt }, 'Education'),
        ...renderEducationRows(user, variant),
      ),
      h(View, { style: pdfStyles.section },
        h(Text, { style: pdfStyles.headingAlt }, 'Notes'),
        h(Text, { style: pdfStyles.paragraph }, `This file intentionally uses a different visual structure from the clean template tier so the CV parser sees some table-like layouts and more compressed data groupings.`),
      ),
    ),
  )
}

function messyCvDocument(user, photoDataUrl) {
  const variant = getTemplateVariant(user)
  return h(Document, null,
    h(Page, { size: 'A4', style: pdfStyles.page },
      h(View, { style: pdfStyles.row },
        h(View, { style: pdfStyles.sidebarMessy },
          h(Image, { src: photoDataUrl, style: pdfStyles.photo }),
          h(Text, { style: pdfStyles.heading }, 'Quick Facts'),
          h(Text, { style: pdfStyles.metaLine }, `${user.nationality}`),
          h(Text, { style: pdfStyles.metaLine }, `DOB ${user.dob}`),
          h(Text, { style: pdfStyles.metaLine }, user.phone),
          h(Text, { style: pdfStyles.metaLine }, user.email),
          h(Text, { style: pdfStyles.metaLine }, `English plus ${Math.max(1, user.languages.length - 1)} other language(s)`),
          h(View, { style: pdfStyles.section }),
          h(Text, { style: pdfStyles.heading }, 'Courses'),
          ...renderCertificates(user, variant),
        ),
        h(View, { style: pdfStyles.main },
          h(Text, { style: pdfStyles.title }, `${user.first} ${user.last}`),
          h(Text, { style: pdfStyles.role }, `${user.role} | ${user.department} Department`),
          h(View, { style: pdfStyles.section },
            h(Text, { style: pdfStyles.heading }, 'Experience First'),
            ...renderEmploymentRows(user, variant),
          ),
          h(View, { style: pdfStyles.section },
            h(Text, { style: pdfStyles.heading }, 'Profile Note'),
            h(Text, { style: pdfStyles.paragraph }, `${user.bio} Availability and references not listed. Test-seed contact details only.`),
          ),
          h(View, { style: pdfStyles.section },
            h(Text, { style: pdfStyles.heading }, 'Education / Training'),
            ...renderEducationRows(user, variant),
          ),
          h(View, { style: pdfStyles.section },
            h(Text, { style: pdfStyles.heading }, 'Skills & Languages'),
            skillChips(user.skills, false),
            h(Text, { style: [pdfStyles.paragraph, { marginTop: 6 }] }, user.languages.map(([language, level]) => `${language} ${level}`).join(' | ')),
          ),
        ),
      ),
    ),
  )
}

async function generatePdfs(users) {
  for (const user of users) {
    const photoPath = path.join(PROFILE_DIR, user.profileFilename)
    const photoDataUrl = await imageToDataUrl(photoPath)
    const document = user.template === 'clean'
      ? cleanCvDocument(user, photoDataUrl)
      : user.template === 'alternate'
        ? alternateCvDocument(user, photoDataUrl)
        : messyCvDocument(user, photoDataUrl)
    const buffer = await renderToBuffer(document)
    await fs.writeFile(path.join(CV_DIR, user.cvFilename), buffer)
  }
}

async function resolveUserProfilePhotos(users) {
  const filenames = (await fs.readdir(PROFILE_DIR))
    .filter((name) => name.toLowerCase().endsWith('.jpg'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

  return users.map((user) => {
    const base = slugify(user.first)
    const matching = filenames.filter((name) =>
      name === `${base}.jpg` || /^.+-\d+\.jpg$/.test(name) && name.startsWith(`${base}-`)
    )
    if (matching.length === 0) return user
    return {
      ...user,
      profileFilename: matching[0],
      profilePhotos: matching,
    }
  })
}

async function resolveGalleryManifestEntries() {
  const baseBySlug = new Map(GALLERY_SCENES.map((scene) => [scene.slug, scene]))
  const filenames = (await fs.readdir(GALLERY_DIR))
    .filter((name) => name.toLowerCase().endsWith('.jpg'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

  return filenames.map((filename) => {
    const slug = filename.replace(/\.jpg$/i, '')
    const base = baseBySlug.get(slug)
    return {
      slug,
      label: base?.label || slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
      photo: `gallery/${filename}`,
    }
  })
}

async function writeManifest(users) {
  const resolvedUsers = await resolveUserProfilePhotos(users)
  const galleryEntries = await resolveGalleryManifestEntries()
  const manifest = {
    generatedAt: new Date().toISOString(),
    asOfDate: AS_OF_DATE,
    counts: {
      profiles: resolvedUsers.reduce((sum, user) => sum + user.profilePhotos.length, 0),
      gallery: galleryEntries.length,
      yachts: YACHTS.length,
      cvs: resolvedUsers.length,
    },
    yachts: YACHTS.map((yacht) => ({
      ...yacht,
      photo: `yachts/${yacht.slug}.jpg`,
    })),
    gallery: galleryEntries,
    users: resolvedUsers.map((user) => ({
      first: user.first,
      last: user.last,
      role: user.role,
      department: user.department,
      nationality: user.nationality,
      dob: user.dob,
      handle: user.handle,
      email: user.email,
      phone: user.phone,
      profilePhoto: `profiles/${user.profileFilename}`,
      profilePhotos: user.profilePhotos.map((filename) => `profiles/${filename}`),
      cv: `cvs/${user.cvFilename}`,
      languages: user.languages,
      skills: user.skills,
      certifications: user.certifications,
      education: user.education,
      assignments: user.assignments,
    })),
  }
  await fs.writeFile(path.join(ASSET_ROOT, 'asset-manifest.json'), JSON.stringify(manifest, null, 2))
}

async function validateOutput(users) {
  const required = [
    [PROFILE_DIR, users.flatMap((user) => user.profilePhotos)],
    [CV_DIR, users.map((user) => user.cvFilename)],
    [YACHT_DIR, YACHTS.map((yacht) => `${yacht.slug}.jpg`)],
    [GALLERY_DIR, GALLERY_SCENES.map((scene) => `${scene.slug}.jpg`)],
  ]

  for (const [dir, filenames] of required) {
    for (const filename of filenames) {
      await fs.access(path.join(dir, filename))
    }
  }
}

async function main() {
  const users = USERS.map(buildStructuredUser)
  await ensureAssetDirectories()
  await generateImages(users)
  await generatePdfs(users)
  await writeManifest(users)
  await validateOutput(users)

  console.log(`Generated ${users.length} profile photos`)
  console.log(`Generated ${GALLERY_SCENES.length} gallery photos`)
  console.log(`Generated ${YACHTS.length} yacht photos`)
  console.log(`Generated ${users.length} CV PDFs`)
  console.log(`Manifest: ${path.join(ASSET_ROOT, 'asset-manifest.json')}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
