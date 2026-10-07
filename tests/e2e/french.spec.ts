import { test, expect } from '@playwright/test';

test('French landing, billing feedback and English switch', async ({ page }) => {
  await page.goto('/?lang=fr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page).toHaveTitle('AIflow, Votre équipe IA. Un seul abonnement.');
  await expect(page.getByRole('heading', {name: 'Votre équipe IA. Un seul abonnement.'})).toBeVisible();
  await expect(page.getByRole('heading', {name: 'Agents IA', exact: true})).toBeVisible();
  await page.getByRole('link', {name: 'Découvrir le fonctionnement', exact: true}).click();
  await expect(page.locator('#how-it-works')).toBeInViewport();
  await page.getByRole('link', {name: 'Commencer mon abonnement', exact: true}).first().click();
  await expect(page.locator('#pricing')).toBeInViewport();
  await expect(page.locator('.price')).toContainText(/2\s?990\s?€/);
  await page.getByRole('button', {name: 'Souscrire', exact: true}).click();
  await expect(page.locator('p[role="alert"]')).toContainText('Les abonnements ne sont pas encore configurés.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', {name: 'English', exact: true}).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', {name: 'Your AI team. One subscription.'})).toBeVisible();
});

test('French demo preserves canonical values, user text and language on navigation', async ({ page }) => {
  await page.goto('/dashboard?demo=1&lang=fr');
  await page.getByRole('button', {name: 'Nouvelle demande', exact: true}).click();
  await page.getByLabel('Titre', {exact: true}).fill('Your AI team.');
  await page.getByLabel('Description', {exact: true}).fill('Envoyer un e-mail de bienvenue.');
  await page.getByLabel('Catégorie', {exact: true}).selectOption({label: 'Agents IA'});
  await page.getByLabel('Priorité', {exact: true}).selectOption({label: 'Basse'});
  await page.getByLabel('Quel résultat attendez-vous ?').fill('Chaque client reçoit un message.');
  await page.getByRole('button', {name: 'Ajouter à la file', exact: true}).click();
  const item = await page.evaluate(() => JSON.parse(localStorage.getItem('aiflow-demo')!).find((r: {title:string}) => r.title === 'Your AI team.'));
  expect(item.category).toBe('AI Agents');
  expect(item.priority).toBe('Low');
  expect(item.status).toBe('queued');
  await page.getByRole('link', {name: 'Your AI team.', exact: true}).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('heading', {name: 'Your AI team.', exact: true})).toBeVisible();
  await page.getByLabel('Votre commentaire').fill('Please keep this customer text unchanged.');
  await page.getByRole('button', {name: 'Envoyer le commentaire', exact: true}).click();
  await page.reload();
  await expect(page.getByText('Please keep this customer text unchanged.', {exact: true})).toBeVisible();
  await page.getByRole('link', {name: 'English', exact: true}).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', {name: 'Your AI team.', exact: true})).toBeVisible();
  await expect(page.getByText('Please keep this customer text unchanged.', {exact: true})).toBeVisible();
});

test('French admin advances the demo queue', async ({ page }) => {
  await page.goto('/admin?demo=1&lang=fr');
  await page.getByRole('combobox', {name: 'Modifier le statut de Automatiser la qualification des prospects entrants'}).selectOption({label: 'terminée'});
  await expect(page.getByRole('link', {name: 'Connecter HubSpot à Slack ↗'})).toBeVisible();
  await page.goto('/dashboard?demo=1');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  const active = page.locator('.column').first();
  await expect(active.getByRole('link', {name: 'Connecter HubSpot à Slack', exact: true})).toBeVisible();
  await expect(active.locator('.request-card')).toHaveCount(1);
});

test('French authentication feedback and preference survive navigation', async ({ page }) => {
  await page.goto('/login?lang=fr');
  await expect(page).toHaveTitle('Connexion client, AIflow');
  await page.getByLabel('E-mail', {exact: true}).fill('demo@example.com');
  await page.getByLabel('Mot de passe', {exact: true}).fill('demopassword');
  await page.getByRole('button', {name: 'Se connecter', exact: true}).click();
  await expect(page.getByRole('status')).toContainText('L’authentification n’est pas encore configurée.');
  await page.getByRole('link', {name: 'Mot de passe oublié ?', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Réinitialiser le mot de passe.'})).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
});
