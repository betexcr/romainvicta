import * as THREE from 'three';
import { THEMES, I18N, CAT_I18N_KEYS, ERA_I18N_KEYS, ll3, ll2c, yrL, yr, CATS } from './app-core.js';
import './data_images.js';
import './data.js';
import './data_es.js';
import './data_wiki.js';
import './data_stats.js';
import './data_tours.js';

if (typeof window !== 'undefined') {
  window.THREE = THREE;
  window.THEMES = THEMES;
  window.I18N = I18N;
  window.CAT_I18N_KEYS = CAT_I18N_KEYS;
  window.ERA_I18N_KEYS = ERA_I18N_KEYS;
  window.ll3 = ll3;
  window.ll2c = ll2c;
  window.yrL = yrL;
  window.yr = yr;
  window.CATS = CATS;
}

export { THEMES, I18N, CAT_I18N_KEYS, ERA_I18N_KEYS, ll3, ll2c, yrL, yr, CATS };
