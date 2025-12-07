import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

// --- Internal API Helper (kein externes api-File nötig) ---
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5829/api').replace(/\/$/, '');

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const api = {
  get: async (endpoint: string) => {
    const res = await fetch(`${API_BASE}${endpoint}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return { data: await res.json() };
  },
  post: async (endpoint: string, body: any = {}) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return { data: await res.json() };
  },
  delete: async (endpoint: string) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return { data: await res.json() };
  },
};
// -----------------------------------------------------------

const ServerDetails: React.FC = () => {
  const { id } = useParams();
  const [server, setServer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'console' | 'plugins' | 'automations' | 'settings'>('console');
  const [status, setStatus] = useState('offline');

  const [logs, setLogs] = useState('');
  const [plugins, setPlugins] = useState<any[]>([]);
  const [automations, setAutomations] = useState<any[]>([]);
  const [properties, setProperties] = useState<any>({});
  const [command, setCommand] = useState('');
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Modal States
  const [showPluginModal, setShowPluginModal] = useState(false);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [newPlugin, setNewPlugin] = useState({ name: '', url: '' });
  const [newAutomation, setNewAutomation] = useState({ name: '', trigger: 'manual', action: '', command: '' });

  // Basis‑Daten + Polling
  useEffect(() => {
    if (!id) return;
    fetchServerDetails();
    const interval = setInterval(() => {
      if (activeTab === 'console') fetchLogs();
      fetchServerDetails();
    }, 3000);
    return () => clearInterval(interval);
  }, [id, activeTab]);

  const fetchServerDetails = async () => {
    try {
      const { data } = await api.get(`/servers/${id}`);
      setServer(data);
      setStatus(data.status || 'offline');
    } catch (error) {
      console.error('Failed to load server', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data } = await api.get(`/servers/${id}/logs`);
      setLogs(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
      if (logsEndRef.current) {
        logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch {
      // ignorieren
    }
  };

  const handlePowerAction = async (action: 'start' | 'stop' | 'restart') => {
    try {
      await api.post(`/servers/${id}/${action}`);
      setStatus(action === 'stop' ? 'stopping' : 'starting');
    } catch {
      alert(`Failed to ${action} server`);
    }
  };

  const sendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    try {
      await api.post(`/servers/${id}/command`, { command });
      setCommand('');
      setTimeout(fetchLogs, 500);
    } catch {
      alert('Failed to send command');
    }
  };

  // Tab‑spezifische Loader
  useEffect(() => {
    if (!id) return;
    if (activeTab === 'plugins') loadPlugins();
    if (activeTab === 'automations') loadAutomations();
    if (activeTab === 'settings') loadProperties();
  }, [activeTab, id]);

  const loadPlugins = async () => {
    try {
      const { data } = await api.get(`/servers/${id}/plugins`);
      setPlugins(Array.isArray(data) ? data : []);
    } catch {}
  };

  const loadAutomations = async () => {
    try {
      const { data } = await api.get(`/servers/${id}/automations`);
      setAutomations(Array.isArray(data) ? data : []);
    } catch {}
  };

  const loadProperties = async () => {
    try {
      const { data } = await api.get(`/servers/${id}/properties`);
      setProperties(data || {});
    } catch {}
  };

  const saveProperties = async () => {
    try {
      await api.post(`/servers/${id}/properties`, properties);
      alert('Settings saved! Restart server to apply.');
    } catch {
      alert('Failed to save settings');
    }
  };

  const handlePropChange = (key: string, value: string) => {
    setProperties((prev: any) => ({ ...prev, [key]: value }));
  };

  // --- Plugin Actions ---
  const handleInstallPlugin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlugin.name) return;
    try {
      await api.post(`/servers/${id}/plugins`, newPlugin);
      setShowPluginModal(false);
      setNewPlugin({ name: '', url: '' });
      loadPlugins();
      alert('Plugin installed successfully!');
    } catch {
      alert('Failed to install plugin');
    }
  };

  const handleDeletePlugin = async (name: string) => {
    if (!confirm(`Delete plugin "${name}"?`)) return;
    try {
      await api.delete(`/servers/${id}/plugins/${name}`);
      loadPlugins();
    } catch {
      alert('Failed to delete plugin');
    }
  };

  // --- Automation Actions ---
  const handleCreateAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAutomation.name) return;
    try {
      await api.post(`/servers/${id}/automations`, newAutomation);
      setShowAutomationModal(false);
      setNewAutomation({ name: '', trigger: 'manual', action: '', command: '' });
      loadAutomations();
      alert('Automation created successfully!');
    } catch {
      alert('Failed to create automation');
    }
  };

  const handleDeleteAutomation = async (autoId: string) => {
    if (!confirm('Delete this automation?')) return;
    try {
      await api.delete(`/servers/${id}/automations/${autoId}`);
      loadAutomations();
    } catch {
      alert('Failed to delete automation');
    }
  };

  if (!server) {
    return (
      <div className="p-10 text-center text-gray-500 dark:text-gray-400">
        Loading server...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-3xl font-bold text-teal-500">{server.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              {server.type}
            </span>
            <span>•</span>
            <span>{server.memory}MB RAM</span>
            <span>•</span>
            <span
              className={`flex items-center gap-1.5 ${
                status === 'running' ? 'text-green-500' : 'text-red-500'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              {status.toUpperCase()}
            </span>
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button
            onClick={() => handlePowerAction('start')}
            disabled={status === 'running'}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm"
          >
            Start
          </button>
          <button
            onClick={() => handlePowerAction('restart')}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm"
          >
            Restart
          </button>
          <button
            onClick={() => handlePowerAction('stop')}
            disabled={status === 'offline'}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm"
          >
            Stop
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-200 dark:bg-gray-800 p-1 rounded-lg w-fit">
        {(['console', 'plugins', 'automations', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-md text-sm capitalize ${
              activeTab === tab
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[600px]">
        {/* Console */}
        {activeTab === 'console' && (
          <div className="flex flex-col h-[600px]">
            <div className="flex-1 bg-black text-gray-300 font-mono p-4 rounded-lg mb-4 overflow-y-auto text-sm border border-gray-800">
              {logs || '> Server is offline or logs are empty...'}
              <div ref={logsEndRef} />
            </div>
            <form onSubmit={sendCommand} className="flex gap-2">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Type a command..."
                className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-sm"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* Plugins */}
        {activeTab === 'plugins' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Installed Plugins</h2>
              <button
                onClick={() => setShowPluginModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <span>+</span> Install Plugin
              </button>
            </div>
            {plugins.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                No plugins installed.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plugins.map((plugin, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex justify-between items-center bg-gray-50 dark:bg-gray-900 hover:shadow-md transition-shadow"
                  >
                    <span className="font-medium truncate">{plugin.name}</span>
                    <button
                      onClick={() => handleDeletePlugin(plugin.name)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Automations */}
        {activeTab === 'automations' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Automations</h2>
              <button
                onClick={() => setShowAutomationModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
              >
                <span>+</span> Create Automation
              </button>
            </div>
            {automations.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                No automations configured.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {automations.map((auto, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">{auto.name || 'Untitled'}</h3>
                      <button
                        onClick={() => handleDeleteAutomation(auto.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>
                        <span className="font-semibold">Trigger:</span> {auto.trigger}
                      </p>
                      <p>
                        <span className="font-semibold">Action:</span> {auto.action}
                      </p>
                      {auto.command && (
                        <p className="font-mono bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                          {auto.command}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Server Properties</h2>
              <button
                onClick={saveProperties}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm"
              >
                Save Changes
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Server Name (MOTD)</label>
                  <input
                    type="text"
                    value={properties['motd'] || ''}
                    onChange={(e) => handlePropChange('motd', e.target.value)}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Difficulty</label>
                  <select
                    value={properties['difficulty'] || 'easy'}
                    onChange={(e) => handlePropChange('difficulty', e.target.value)}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
                  >
                    <option value="peaceful">Peaceful</option>
                    <option value="easy">Easy</option>
                    <option value="normal">Normal</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Game Mode</label>
                  <select
                    value={properties['gamemode'] || 'survival'}
                    onChange={(e) => handlePropChange('gamemode', e.target.value)}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
                  >
                    <option value="survival">Survival</option>
                    <option value="creative">Creative</option>
                    <option value="adventure">Adventure</option>
                    <option value="spectator">Spectator</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Max Players</label>
                  <input
                    type="number"
                    value={properties['max-players'] || '20'}
                    onChange={(e) => handlePropChange('max-players', e.target.value)}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Level Seed</label>
                  <input
                    type="text"
                    value={properties['level-seed'] || ''}
                    onChange={(e) => handlePropChange('level-seed', e.target.value)}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="pvp"
                    checked={properties['pvp'] === 'true'}
                    onChange={(e) => handlePropChange('pvp', e.target.checked ? 'true' : 'false')}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="pvp" className="text-sm">
                    Enable PvP
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plugin Modal */}
      {showPluginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4">Install Plugin</h3>
            <form onSubmit={handleInstallPlugin} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Plugin Name</label>
                <input
                  type="text"
                  value={newPlugin.name}
                  onChange={(e) => setNewPlugin({ ...newPlugin, name: e.target.value })}
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Download URL (optional)</label>
                <input
                  type="url"
                  value={newPlugin.url}
                  onChange={(e) => setNewPlugin({ ...newPlugin, url: e.target.value })}
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
                >
                  Install
                </button>
                <button
                  type="button"
                  onClick={() => setShowPluginModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Automation Modal */}
      {showAutomationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4">Create Automation</h3>
            <form onSubmit={handleCreateAutomation} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input
                  type="text"
                  value={newAutomation.name}
                  onChange={(e) => setNewAutomation({ ...newAutomation, name: e.target.value })}
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Trigger</label>
                <select
                  value={newAutomation.trigger}
                  onChange={(e) => setNewAutomation({ ...newAutomation, trigger: e.target.value })}
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
                >
                  <option value="manual">Manual</option>
                  <option value="startup">Server Startup</option>
                  <option value="shutdown">Server Shutdown</option>
                  <option value="interval">Every X Minutes</option>
                  <option value="player_join">Player Join</option>
                  <option value="player_leave">Player Leave</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Action</label>
                <select
                  value={newAutomation.action}
                  onChange={(e) => setNewAutomation({ ...newAutomation, action: e.target.value })}
                  className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
                >
                  <option value="command">Run Command</option>
                  <option value="backup">Create Backup</option>
                  <option value="restart">Restart Server</option>
                  <option value="notification">Send Notification</option>
                </select>
              </div>
              {newAutomation.action === 'command' && (
                <div>
                  <label className="block text-sm mb-1">Command</label>
                  <input
                    type="text"
                    value={newAutomation.command}
                    onChange={(e) => setNewAutomation({ ...newAutomation, command: e.target.value })}
                    placeholder="say Hello World"
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent font-mono text-sm"
                  />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowAutomationModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerDetails;
