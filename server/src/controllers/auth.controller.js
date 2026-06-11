import * as authService from '../services/auth.service.js';

export async function register(req, res) {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}

export async function login(req, res) {
  const result = await authService.login(req.body);
  res.json(result);
}

export async function me(req, res) {
  const profile = await authService.getProfile(req.user.id);
  res.json(profile);
}

export async function updateProfile(req, res) {
  res.json(await authService.updateProfile(req.user.id, req.body));
}

export async function changePassword(req, res) {
  res.json(await authService.changePassword(req.user.id, req.body));
}
