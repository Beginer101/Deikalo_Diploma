import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { httpError } from '../lib/httpError.js';
import * as userRepo from '../repositories/user.repository.js';
import { canCreateProjects } from './project.service.js';

// Додає до об'єкта користувача обчислювані можливості (capabilities)
async function withCapabilities(user) {
  if (!user) return user;
  return { ...user, can_create_projects: await canCreateProjects(user) };
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      organization_id: user.organization_id,
      full_name: user.full_name,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

export async function register({ full_name, email, password, organization_id }) {
  if (!full_name || !email || !password) {
    throw httpError(400, "Вкажіть ім'я, email та пароль");
  }
  const password_hash = await bcrypt.hash(password, 10);
  const user = await userRepo.create(undefined, {
    full_name,
    email: email.toLowerCase(),
    password_hash,
    organization_id,
  });
  return { token: signToken(user), user: await withCapabilities(user) };
}

export async function login({ email, password }) {
  if (!email || !password) throw httpError(400, 'Вкажіть email та пароль');
  const user = await userRepo.findByEmail(undefined, email.toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw httpError(401, 'Невірний email або пароль');
  }
  delete user.password_hash;
  return { token: signToken(user), user: await withCapabilities(user) };
}

export async function getProfile(userId) {
  const user = await userRepo.findProfileById(undefined, userId);
  return withCapabilities(user);
}
