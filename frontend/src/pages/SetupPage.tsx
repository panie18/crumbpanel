import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { Server, User, Mail, Lock, Palette, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

const API_URL = 'http://localhost:5829/api';

const PRESET_COLORS = [
	{ name: 'Classic Black', primary: '#000000', accent: '#ffffff' },
	{ name: 'Deep Blue', primary: '#1e3a8a', accent: '#3b82f6' },
	{ name: 'Purple Dream', primary: '#581c87', accent: '#a855f7' },
	{ name: 'Forest Green', primary: '#064e3b', accent: '#10b981' },
	{ name: 'Sunset Orange', primary: '#7c2d12', accent: '#f97316' },
	{ name: 'Pink Passion', primary: '#831843', accent: '#ec4899' },
];

export default function SetupPage() {
	const [step, setStep] = useState(1);
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
	const [customPrimary, setCustomPrimary] = useState('#000000');
	const [customAccent, setCustomAccent] = useState('#ffffff');
	const navigate = useNavigate();
	const { setAuth } = useAuthStore();
	const { setCustomColors } = useThemeStore();

	const { data: setupStatus } = useQuery({
		queryKey: ['setup-status'],
		queryFn: async () => {
			try {
				console.log('🔍 Checking setup status...');
				const response = await axios.get(`${API_URL}/auth/setup-status`, {
					timeout: 10000,
				});
				console.log('✅ Setup status:', response.data);
				return response.data;
			} catch (error) {
				console.error('❌ Setup status check failed:', error);
				return { needsSetup: true };
			}
		},
		retry: 2,
		retryDelay: 1000,
	});

	useEffect(() => {
		if (setupStatus?.isSetupComplete === true) {
			navigate('/login', { replace: true });
		}
	}, [setupStatus, navigate]);

	const setupMutation = useMutation({
		mutationFn: async (data: { username: string; email: string; password: string }) => {
			console.log('🚀 Starting setup with data:', { email: data.email, username: data.username });
			
			try {
				const response = await axios.post(`${API_URL}/auth/setup`, data, {
					timeout: 30000,
					headers: {
						'Content-Type': 'application/json',
					},
				});
				console.log('✅ Setup response:', response.data);
				return response;
			} catch (error) {
				console.error('❌ Setup request failed:', error);
				throw error;
			}
		},
		onSuccess: (response) => {
			console.log('🎉 Setup successful!');
			const { user, accessToken, refreshToken } = response.data;
			setAuth(user, accessToken, refreshToken);
			setCustomColors(customPrimary, customAccent);
			toast.success('Welcome to CrumbPanel! 🎉');
			navigate('/');
		},
		onError: (error: any) => {
			console.error('💥 Setup failed:', error);
			
			let errorMessage = 'Setup failed. Please check the server logs.';
			
			if (error.response?.data?.message) {
				errorMessage = error.response.data.message;
			} else if (error.code === 'ECONNABORTED') {
				errorMessage = 'Request timeout. Server might be slow to start.';
			} else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
				errorMessage = 'Cannot reach server. Make sure backend is running on port 5829.';
			}
			
			toast.error(errorMessage, { duration: 8000 });
		},
	});

	const handleNext = () => {
		if (step === 1 && !username.trim()) {
			toast.error('Please enter your name');
			return;
		}
		if (step === 2 && !email.trim()) {
			toast.error('Please enter your email');
			return;
		}
		if (step === 3) {
			if (password.length < 6) {
				toast.error('Password must be at least 6 characters');
				return;
			}
			if (password !== confirmPassword) {
				toast.error('Passwords do not match');
				return;
			}
		}
		setStep(step + 1);
	};

	const handleBack = () => {
		setStep(step - 1);
	};

	const handleFinish = () => {
		setupMutation.mutate({ username, email, password });
	};

	const applyPresetColor = (preset: typeof PRESET_COLORS[0]) => {
		setSelectedColor(preset);
		setCustomPrimary(preset.primary);
		setCustomAccent(preset.accent);
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<div className="fixed top-4 right-4">
				<ThemeToggle />
			</div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="w-full max-w-lg"
			>
				<Card className="border-border">
					<CardHeader className="text-center space-y-4">
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ type: 'spring' }}
							className="mx-auto w-16 h-16 rounded-xl flex items-center justify-center"
							style={{ backgroundColor: customPrimary }}
						>
							<Server className="w-8 h-8" style={{ color: customAccent }} />
						</motion.div>
						<CardTitle className="text-3xl">Welcome to CrumbPanel</CardTitle>
						<CardDescription>Let's get you set up in just a few steps</CardDescription>

						{/* Progress Indicator */}
						<div className="flex justify-center gap-2 pt-4">
							{[1, 2, 3, 4].map((i) => (
								<div
									key={i}
									className={`h-2 w-12 rounded-full transition-all ${
										i <= step ? 'bg-primary' : 'bg-muted'
									}`}
									style={i <= step ? { backgroundColor: customPrimary } : {}}
								/>
							))}
						</div>
					</CardHeader>

					<CardContent>
						<AnimatePresence mode="wait">
							{/* Step 1: Name */}
							{step === 1 && (
								<motion.div
									key="step1"
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									className="space-y-4"
								>
									<div className="text-center mb-6">
										<User className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
										<h3 className="text-xl font-semibold">What's your name?</h3>
										<p className="text-sm text-muted-foreground">
											This will be your display name
										</p>
									</div>
									<div className="space-y-2">
										<Label htmlFor="username">Username</Label>
										<Input
											id="username"
											type="text"
											placeholder="John Doe"
											value={username}
											onChange={(e) => setUsername(e.target.value)}
											autoFocus
											onKeyPress={(e) => e.key === 'Enter' && handleNext()}
										/>
									</div>
									<Button onClick={handleNext} className="w-full">
										Next{' '}
										<ArrowRight className="ml-2 w-4 h-4" />
									</Button>
								</motion.div>
							)}

							{/* Step 2: Email */}
							{step === 2 && (
								<motion.div
									key="step2"
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									className="space-y-4"
								>
									<div className="text-center mb-6">
										<Mail className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
										<h3 className="text-xl font-semibold">What's your email?</h3>
										<p className="text-sm text-muted-foreground">
											You'll use this to sign in
										</p>
									</div>
									<div className="space-y-2">
										<Label htmlFor="email">Email Address</Label>
										<Input
											id="email"
											type="email"
											placeholder="admin@crumbpanel.local"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											autoFocus
											onKeyPress={(e) => e.key === 'Enter' && handleNext()}
										/>
									</div>
									<div className="flex gap-2">
										<Button onClick={handleBack} variant="outline" className="flex-1">
											<ArrowLeft className="mr-2 w-4 h-4" /> Back
										</Button>
										<Button onClick={handleNext} className="flex-1">
											Next{' '}
											<ArrowRight className="ml-2 w-4 h-4" />
										</Button>
									</div>
								</motion.div>
							)}

							{/* Step 3: Password */}
							{step === 3 && (
								<motion.div
									key="step3"
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									className="space-y-4"
								>
									<div className="text-center mb-6">
										<Lock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
										<h3 className="text-xl font-semibold">Create a password</h3>
										<p className="text-sm text-muted-foreground">
											Keep your account secure
										</p>
									</div>
									<div className="space-y-2">
										<Label htmlFor="password">Password</Label>
										<Input
											id="password"
											type="password"
											placeholder="••••••••"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											autoFocus
										/>
										<p className="text-xs text-muted-foreground">
											Minimum 6 characters
										</p>
									</div>
									<div className="space-y-2">
										<Label htmlFor="confirmPassword">Confirm Password</Label>
										<Input
											id="confirmPassword"
											type="password"
											placeholder="••••••••"
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											onKeyPress={(e) => e.key === 'Enter' && handleNext()}
										/>
									</div>
									<div className="flex gap-2">
										<Button onClick={handleBack} variant="outline" className="flex-1">
											<ArrowLeft className="mr-2 w-4 h-4" /> Back
										</Button>
										<Button onClick={handleNext} className="flex-1">
											Next{' '}
											<ArrowRight className="ml-2 w-4 h-4" />
										</Button>
									</div>
								</motion.div>
							)}

							{/* Step 4: Color Customization */}
							{step === 4 && (
								<motion.div
									key="step4"
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -20 }}
									className="space-y-4"
								>
									<div className="text-center mb-6">
										<Palette className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
										<h3 className="text-xl font-semibold">Choose your colors</h3>
										<p className="text-sm text-muted-foreground">
											Personalize your experience
										</p>
									</div>

									{/* Preset Colors */}
									<div className="space-y-3">
										<Label>Color Presets</Label>
										<div className="grid grid-cols-3 gap-2">
											{PRESET_COLORS.map((preset) => (
												<button
													key={preset.name}
													onClick={() => applyPresetColor(preset)}
													className={`relative p-3 rounded-lg border-2 transition-all ${
														selectedColor.name === preset.name
															? 'border-primary scale-105'
															: 'border-border hover:border-muted-foreground'
													}`}
												>
													<div className="flex gap-1">
														<div
															className="w-8 h-8 rounded"
															style={{ backgroundColor: preset.primary }}
														/>
														<div
															className="w-8 h-8 rounded"
															style={{ backgroundColor: preset.accent }}
														/>
													</div>
													<p className="text-xs mt-2 text-muted-foreground">
														{preset.name}
													</p>
													{selectedColor.name === preset.name && (
														<Check className="absolute top-1 right-1 w-4 h-4 text-primary" />
													)}
												</button>
											))}
										</div>
									</div>

									{/* Custom Colors */}
									<div className="space-y-3">
										<Label>Custom Colors</Label>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="primary" className="text-xs">
													Primary Color
												</Label>
												<div className="flex gap-2">
													<Input
														id="primary"
														type="color"
														value={customPrimary}
														onChange={(e) => setCustomPrimary(e.target.value)}
														className="h-10 w-full cursor-pointer"
													/>
													<Input
														type="text"
														value={customPrimary}
														onChange={(e) => setCustomPrimary(e.target.value)}
														className="w-24 font-mono text-xs"
													/>
												</div>
											</div>
											<div className="space-y-2">
												<Label htmlFor="accent" className="text-xs">
													Accent Color
												</Label>
												<div className="flex gap-2">
													<Input
														id="accent"
														type="color"
														value={customAccent}
														onChange={(e) => setCustomAccent(e.target.value)}
														className="h-10 w-full cursor-pointer"
													/>
													<Input
														type="text"
														value={customAccent}
														onChange={(e) => setCustomAccent(e.target.value)}
														className="w-24 font-mono text-xs"
													/>
												</div>
											</div>
										</div>
									</div>

									{/* Preview */}
									<div className="p-4 rounded-lg border border-border space-y-2">
										<p className="text-xs text-muted-foreground">Preview:</p>
										<div className="flex gap-2">
											<div
												className="flex-1 h-12 rounded flex items-center justify-center text-sm font-medium"
												style={{ backgroundColor: customPrimary, color: customAccent }}
											>
												Primary
											</div>
											<div
												className="flex-1 h-12 rounded flex items-center justify-center text-sm font-medium"
												style={{ backgroundColor: customAccent, color: customPrimary }}
											>
												Accent
											</div>
										</div>
									</div>

									<div className="flex gap-2">
										<Button onClick={handleBack} variant="outline" className="flex-1">
											<ArrowLeft className="mr-2 w-4 h-4" /> Back
										</Button>
										<Button
											onClick={handleFinish}
											className="flex-1"
											disabled={setupMutation.isPending}
											style={{ backgroundColor: customPrimary, color: customAccent }}
										>
											{setupMutation.isPending ? 'Creating...' : 'Finish Setup'}{' '}
											<Check className="ml-2 w-4 h-4" />
										</Button>
									</div>
								</motion.div>
							)}
						</AnimatePresence>

						<div className="mt-6 text-center text-xs text-muted-foreground">
							Made by{' '}
							<a
								href="https://paulify.eu"
								target="_blank"
								rel="noopener noreferrer"
								className="text-foreground hover:text-muted-foreground"
							>
								paulify.dev
							</a>
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}
