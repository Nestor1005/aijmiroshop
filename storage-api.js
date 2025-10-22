// =====================================================
// API de Almacenamiento Unificada (localStorage + Supabase)
// =====================================================

const StorageAPI = {
    // Verificar si Supabase está disponible
    isSupabaseReady() {
        return window.supabaseConfig && 
               window.supabaseConfig.getClient() && 
               window.supabaseConfig.getMode() === 'supabase';
    },

    // USUARIOS (users table)
    async getUsers() {
        if (this.isSupabaseReady()) {
            try {
                const client = window.supabaseConfig.getClient();
                const { data, error } = await client
                    .from('users')
                    .select('*')
                    .order('id', { ascending: true });
                
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Error al obtener usuarios de Supabase:', error);
                // Fallback a localStorage
                return JSON.parse(localStorage.getItem('users')) || [];
            }
        }
        return JSON.parse(localStorage.getItem('users')) || [];
    },

    async saveUser(user) {
        if (this.isSupabaseReady()) {
            try {
                const client = window.supabaseConfig.getClient();
                
                if (user.id) {
                    // Actualizar usuario existente
                    const { data, error } = await client
                        .from('users')
                        .update({
                            username: user.username,
                            password: user.password,
                            role: user.role,
                            name: user.name,
                            active: user.active,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', user.id)
                        .select();
                    
                    if (error) throw error;
                    return data[0];
                } else {
                    // Crear nuevo usuario
                    const { data, error } = await client
                        .from('users')
                        .insert([{
                            username: user.username,
                            password: user.password,
                            role: user.role,
                            name: user.name,
                            active: user.active !== false
                        }])
                        .select();
                    
                    if (error) throw error;
                    return data[0];
                }
            } catch (error) {
                console.error('Error al guardar usuario en Supabase:', error);
                // Fallback a localStorage
                return this.saveUserLocal(user);
            }
        }
        return this.saveUserLocal(user);
    },

    saveUserLocal(user) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        if (user.id) {
            const index = users.findIndex(u => u.id === user.id);
            if (index !== -1) {
                users[index] = { ...users[index], ...user };
            }
        } else {
            user.id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
            users.push(user);
        }
        localStorage.setItem('users', JSON.stringify(users));
        return user;
    },

    async deleteUser(userId) {
        if (this.isSupabaseReady()) {
            try {
                const client = window.supabaseConfig.getClient();
                const { error } = await client
                    .from('users')
                    .delete()
                    .eq('id', userId);
                
                if (error) throw error;
                return true;
            } catch (error) {
                console.error('Error al eliminar usuario de Supabase:', error);
                return this.deleteUserLocal(userId);
            }
        }
        return this.deleteUserLocal(userId);
    },

    deleteUserLocal(userId) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const filtered = users.filter(u => u.id !== userId);
        localStorage.setItem('users', JSON.stringify(filtered));
        return true;
    },

    // PRODUCTOS (products table)
    async getProducts() {
        if (this.isSupabaseReady()) {
            try {
                const client = window.supabaseConfig.getClient();
                const { data, error } = await client
                    .from('products')
                    .select('*')
                    .order('name', { ascending: true });
                
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Error al obtener productos de Supabase:', error);
                return JSON.parse(localStorage.getItem('products')) || [];
            }
        }
        return JSON.parse(localStorage.getItem('products')) || [];
    },

    async saveProduct(product) {
        if (this.isSupabaseReady()) {
            try {
                const client = window.supabaseConfig.getClient();
                
                if (product.id) {
                    const { data, error } = await client
                        .from('products')
                        .update({
                            name: product.name,
                            color: product.color,
                            stock: product.stock,
                            cost: product.cost,
                            price: product.price,
                            image: product.image || '',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', product.id)
                        .select();
                    
                    if (error) throw error;
                    return data[0];
                } else {
                    const { data, error } = await client
                        .from('products')
                        .insert([{
                            name: product.name,
                            color: product.color,
                            stock: product.stock,
                            cost: product.cost,
                            price: product.price,
                            image: product.image || ''
                        }])
                        .select();
                    
                    if (error) throw error;
                    return data[0];
                }
            } catch (error) {
                console.error('Error al guardar producto en Supabase:', error);
                return this.saveProductLocal(product);
            }
        }
        return this.saveProductLocal(product);
    },

    saveProductLocal(product) {
        const products = JSON.parse(localStorage.getItem('products')) || [];
        if (product.id) {
            const index = products.findIndex(p => p.id === product.id);
            if (index !== -1) {
                products[index] = { ...products[index], ...product };
            }
        } else {
            product.id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
            products.push(product);
        }
        localStorage.setItem('products', JSON.stringify(products));
        return product;
    },

    async deleteProduct(productId) {
        if (this.isSupabaseReady()) {
            try {
                const client = window.supabaseConfig.getClient();
                const { error } = await client
                    .from('products')
                    .delete()
                    .eq('id', productId);
                
                if (error) throw error;
                return true;
            } catch (error) {
                console.error('Error al eliminar producto de Supabase:', error);
                return this.deleteProductLocal(productId);
            }
        }
        return this.deleteProductLocal(productId);
    },

    deleteProductLocal(productId) {
        const products = JSON.parse(localStorage.getItem('products')) || [];
        const filtered = products.filter(p => p.id !== productId);
        localStorage.setItem('products', JSON.stringify(filtered));
        return true;
    },

    // CLIENTES (clients table)
    async getClients() {
        if (this.isSupabaseReady()) {
            try {
                const client = window.supabaseConfig.getClient();
                const { data, error } = await client
                    .from('clients')
                    .select('*')
                    .order('name', { ascending: true });
                
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Error al obtener clientes de Supabase:', error);
                return JSON.parse(localStorage.getItem('clients')) || [];
            }
        }
        return JSON.parse(localStorage.getItem('clients')) || [];
    },

    async saveClient(client) {
        if (this.isSupabaseReady()) {
            try {
                const supabase = window.supabaseConfig.getClient();
                
                if (client.id) {
                    const { data, error } = await supabase
                        .from('clients')
                        .update({
                            name: client.name,
                            ci: client.ci,
                            complement: client.complement || null,
                            phone: client.phone || null,
                            address: client.address || null,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', client.id)
                        .select();
                    
                    if (error) throw error;
                    return data[0];
                } else {
                    const { data, error } = await supabase
                        .from('clients')
                        .insert([{
                            name: client.name,
                            ci: client.ci,
                            complement: client.complement || null,
                            phone: client.phone || null,
                            address: client.address || null
                        }])
                        .select();
                    
                    if (error) throw error;
                    return data[0];
                }
            } catch (error) {
                console.error('Error al guardar cliente en Supabase:', error);
                return this.saveClientLocal(client);
            }
        }
        return this.saveClientLocal(client);
    },

    saveClientLocal(client) {
        const clients = JSON.parse(localStorage.getItem('clients')) || [];
        if (client.id) {
            const index = clients.findIndex(c => c.id === client.id);
            if (index !== -1) {
                clients[index] = { ...clients[index], ...client };
            }
        } else {
            client.id = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;
            clients.push(client);
        }
        localStorage.setItem('clients', JSON.stringify(clients));
        return client;
    },

    // CONFIGURACIONES (settings table)
    async getSettings(key) {
        if (this.isSupabaseReady()) {
            try {
                const client = window.supabaseConfig.getClient();
                const { data, error } = await client
                    .from('settings')
                    .select('value')
                    .eq('key', key)
                    .single();
                
                if (error) throw error;
                return data ? data.value : null;
            } catch (error) {
                console.error('Error al obtener configuración de Supabase:', error);
                return JSON.parse(localStorage.getItem(key));
            }
        }
        return JSON.parse(localStorage.getItem(key));
    },

    async saveSettings(key, value) {
        if (this.isSupabaseReady()) {
            try {
                const client = window.supabaseConfig.getClient();
                const { data, error } = await client
                    .from('settings')
                    .upsert({
                        key: key,
                        value: value,
                        updated_at: new Date().toISOString()
                    })
                    .select();
                
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Error al guardar configuración en Supabase:', error);
                localStorage.setItem(key, JSON.stringify(value));
                return value;
            }
        }
        localStorage.setItem(key, JSON.stringify(value));
        return value;
    }

    // ======================
    // Realtime (Supabase)
    // ======================
    _realtimeSubs: [],

    startRealtime() {
        if (!this.isSupabaseReady()) return;
        try {
            const client = window.supabaseConfig.getClient();

            // Suscribirse a tablas que necesitamos sincronizar
            const tables = ['users', 'products', 'clients', 'sales', 'sale_items', 'settings'];

            tables.forEach(table => {
                const subscription = client
                    .channel('public:' + table)
                    .on('postgres_changes', { event: '*', schema: 'public', table: table }, payload => {
                        const detail = { table, event: payload.eventType, record: payload.new || payload.old };
                        // Emitir evento global
                        window.dispatchEvent(new CustomEvent('realtime-change', { detail }));
                    })
                    .subscribe(status => {
                        // status puede ser SUBSCRIBED, ERROR, etc.
                        console.log('Realtime', table, status);
                    });

                this._realtimeSubs.push(subscription);
            });
        } catch (err) {
            console.error('Error al iniciar realtime:', err);
        }
    },

    stopRealtime() {
        try {
            const client = window.supabaseConfig.getClient();
            this._realtimeSubs.forEach(sub => {
                try { client.removeChannel(sub); } catch (e) { /* ignore */ }
            });
            this._realtimeSubs = [];
        } catch (err) {
            console.warn('Error al detener realtime', err);
        }
    }
};

// Hacer disponible globalmente
window.StorageAPI = StorageAPI;

console.log('📦 Storage API cargada correctamente');
