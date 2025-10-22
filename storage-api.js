// =====================================================// =====================================================

// API de Almacenamiento - 100% SUPABASE (Cloud Only)// API de Almacenamiento Unificada (localStorage + Supabase)

// Sin localStorage - TODO se guarda en la nube// =====================================================

// =====================================================

const StorageAPI = {

const StorageAPI = {    // Verificar si Supabase está disponible

    _realtimeSubs: [],    isSupabaseReady() {

        return window.supabaseConfig && 

    // Verificar si Supabase está disponible               window.supabaseConfig.getClient() && 

    isSupabaseReady() {               window.supabaseConfig.getMode() === 'supabase';

        return window.supabaseConfig &&     },

               window.supabaseConfig.getClient() && 

               window.supabaseConfig.getMode() === 'supabase';    // USUARIOS (users table)

    },    async getUsers() {

        if (this.isSupabaseReady()) {

    // ==================== USUARIOS ====================            try {

    async getUsers() {                const client = window.supabaseConfig.getClient();

        if (!this.isSupabaseReady()) {                const { data, error } = await client

            console.error('❌ Supabase no disponible');                    .from('users')

            return [];                    .select('*')

        }                    .order('id', { ascending: true });

                        

        try {                if (error) throw error;

            const client = window.supabaseConfig.getClient();                return data || [];

            const { data, error } = await client            } catch (error) {

                .from('users')                console.error('Error al obtener usuarios de Supabase:', error);

                .select('*')                // Fallback a localStorage

                .order('id', { ascending: true });                return JSON.parse(localStorage.getItem('users')) || [];

                        }

            if (error) throw error;        }

            return data || [];        return JSON.parse(localStorage.getItem('users')) || [];

        } catch (error) {    },

            console.error('❌ Error al obtener usuarios:', error);

            return [];    async saveUser(user) {

        }        // SIEMPRE intentar guardar en Supabase primero

    },        if (this.isSupabaseReady()) {

            try {

    async saveUser(user) {                const client = window.supabaseConfig.getClient();

        if (!this.isSupabaseReady()) {                

            throw new Error('Supabase no disponible');                if (user.id) {

        }                    // Actualizar usuario existente

                            const { data, error } = await client

        try {                        .from('users')

            const client = window.supabaseConfig.getClient();                        .update({

                                        username: user.username,

            if (user.id) {                            password: user.password,

                // Actualizar                            role: user.role,

                const { data, error } = await client                            name: user.name,

                    .from('users')                            active: user.active,

                    .update({                            updated_at: new Date().toISOString()

                        username: user.username,                        })

                        password: user.password,                        .eq('id', user.id)

                        role: user.role,                        .select();

                        name: user.name,                    

                        active: user.active,                    if (error) throw error;

                        updated_at: new Date().toISOString()                    // También guardar en localStorage como backup

                    })                    this.saveUserLocal(user);

                    .eq('id', user.id)                    return data[0];

                    .select();                } else {

                                    // Crear nuevo usuario

                if (error) throw error;                    const { data, error } = await client

                console.log('✅ Usuario actualizado en Supabase');                        .from('users')

                return data[0];                        .insert([{

            } else {                            username: user.username,

                // Crear                            password: user.password,

                const { data, error } = await client                            role: user.role,

                    .from('users')                            name: user.name,

                    .insert([{                            active: user.active !== false

                        username: user.username,                        }])

                        password: user.password,                        .select();

                        role: user.role,                    

                        name: user.name,                    if (error) throw error;

                        active: user.active !== false                    // También guardar en localStorage como backup

                    }])                    this.saveUserLocal(data[0]);

                    .select();                    return data[0];

                                }

                if (error) throw error;            } catch (error) {

                console.log('✅ Usuario creado en Supabase');                console.error('Error al guardar usuario en Supabase:', error);

                return data[0];                // Fallback a localStorage

            }                return this.saveUserLocal(user);

        } catch (error) {            }

            console.error('❌ Error al guardar usuario:', error);        }

            throw error;        // Si Supabase no está disponible, usar localStorage

        }        return this.saveUserLocal(user);

    },    },



    async deleteUser(userId) {    saveUserLocal(user) {

        if (!this.isSupabaseReady()) {        const users = JSON.parse(localStorage.getItem('users')) || [];

            throw new Error('Supabase no disponible');        if (user.id) {

        }            const index = users.findIndex(u => u.id === user.id);

                    if (index !== -1) {

        try {                users[index] = { ...users[index], ...user };

            const client = window.supabaseConfig.getClient();            }

            const { error } = await client        } else {

                .from('users')            user.id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;

                .delete()            users.push(user);

                .eq('id', userId);        }

                    localStorage.setItem('users', JSON.stringify(users));

            if (error) throw error;        return user;

            console.log('✅ Usuario eliminado de Supabase');    },

            return true;

        } catch (error) {    async deleteUser(userId) {

            console.error('❌ Error al eliminar usuario:', error);        if (this.isSupabaseReady()) {

            throw error;            try {

        }                const client = window.supabaseConfig.getClient();

    },                const { error } = await client

                    .from('users')

    // ==================== PRODUCTOS ====================                    .delete()

    async getProducts() {                    .eq('id', userId);

        if (!this.isSupabaseReady()) {                

            console.error('❌ Supabase no disponible');                if (error) throw error;

            return [];                return true;

        }            } catch (error) {

                        console.error('Error al eliminar usuario de Supabase:', error);

        try {                return this.deleteUserLocal(userId);

            const client = window.supabaseConfig.getClient();            }

            const { data, error } = await client        }

                .from('products')        return this.deleteUserLocal(userId);

                .select('*')    },

                .order('name', { ascending: true });

                deleteUserLocal(userId) {

            if (error) throw error;        const users = JSON.parse(localStorage.getItem('users')) || [];

            return data || [];        const filtered = users.filter(u => u.id !== userId);

        } catch (error) {        localStorage.setItem('users', JSON.stringify(filtered));

            console.error('❌ Error al obtener productos:', error);        return true;

            return [];    },

        }

    },    // PRODUCTOS (products table)

    async getProducts() {

    async saveProduct(product) {        if (this.isSupabaseReady()) {

        if (!this.isSupabaseReady()) {            try {

            throw new Error('Supabase no disponible');                const client = window.supabaseConfig.getClient();

        }                const { data, error } = await client

                            .from('products')

        try {                    .select('*')

            const client = window.supabaseConfig.getClient();                    .order('name', { ascending: true });

                            

            if (product.id) {                if (error) throw error;

                // Actualizar                return data || [];

                const { data, error } = await client            } catch (error) {

                    .from('products')                console.error('Error al obtener productos de Supabase:', error);

                    .update({                return JSON.parse(localStorage.getItem('products')) || [];

                        name: product.name,            }

                        color: product.color,        }

                        stock: product.stock,        return JSON.parse(localStorage.getItem('products')) || [];

                        cost: product.cost,    },

                        price: product.price,

                        image: product.image || '',    async saveProduct(product) {

                        updated_at: new Date().toISOString()        // SIEMPRE intentar guardar en Supabase primero

                    })        if (this.isSupabaseReady()) {

                    .eq('id', product.id)            try {

                    .select();                const client = window.supabaseConfig.getClient();

                                

                if (error) throw error;                if (product.id) {

                console.log('✅ Producto actualizado en Supabase');                    const { data, error } = await client

                return data[0];                        .from('products')

            } else {                        .update({

                // Crear                            name: product.name,

                const { data, error } = await client                            color: product.color,

                    .from('products')                            stock: product.stock,

                    .insert([{                            cost: product.cost,

                        name: product.name,                            price: product.price,

                        color: product.color,                            image: product.image || '',

                        stock: product.stock,                            updated_at: new Date().toISOString()

                        cost: product.cost,                        })

                        price: product.price,                        .eq('id', product.id)

                        image: product.image || ''                        .select();

                    }])                    

                    .select();                    if (error) throw error;

                                    // También guardar en localStorage como backup

                if (error) throw error;                    this.saveProductLocal(product);

                console.log('✅ Producto creado en Supabase');                    return data[0];

                return data[0];                } else {

            }                    const { data, error } = await client

        } catch (error) {                        .from('products')

            console.error('❌ Error al guardar producto:', error);                        .insert([{

            throw error;                            name: product.name,

        }                            color: product.color,

    },                            stock: product.stock,

                            cost: product.cost,

    async deleteProduct(productId) {                            price: product.price,

        if (!this.isSupabaseReady()) {                            image: product.image || ''

            throw new Error('Supabase no disponible');                        }])

        }                        .select();

                            

        try {                    if (error) throw error;

            const client = window.supabaseConfig.getClient();                    // También guardar en localStorage como backup

            const { error } = await client                    this.saveProductLocal(data[0]);

                .from('products')                    return data[0];

                .delete()                }

                .eq('id', productId);            } catch (error) {

                            console.error('Error al guardar producto en Supabase:', error);

            if (error) throw error;                return this.saveProductLocal(product);

            console.log('✅ Producto eliminado de Supabase');            }

            return true;        }

        } catch (error) {        return this.saveProductLocal(product);

            console.error('❌ Error al eliminar producto:', error);    },

            throw error;

        }    saveProductLocal(product) {

    },        const products = JSON.parse(localStorage.getItem('products')) || [];

        if (product.id) {

    // ==================== CLIENTES ====================            const index = products.findIndex(p => p.id === product.id);

    async getClients() {            if (index !== -1) {

        if (!this.isSupabaseReady()) {                products[index] = { ...products[index], ...product };

            console.error('❌ Supabase no disponible');            }

            return [];        } else {

        }            product.id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;

                    products.push(product);

        try {        }

            const client = window.supabaseConfig.getClient();        localStorage.setItem('products', JSON.stringify(products));

            const { data, error } = await client        return product;

                .from('clients')    },

                .select('*')

                .order('name', { ascending: true });    async deleteProduct(productId) {

                    if (this.isSupabaseReady()) {

            if (error) throw error;            try {

            return data || [];                const client = window.supabaseConfig.getClient();

        } catch (error) {                const { error } = await client

            console.error('❌ Error al obtener clientes:', error);                    .from('products')

            return [];                    .delete()

        }                    .eq('id', productId);

    },                

                if (error) throw error;

    async saveClient(clientData) {                return true;

        if (!this.isSupabaseReady()) {            } catch (error) {

            throw new Error('Supabase no disponible');                console.error('Error al eliminar producto de Supabase:', error);

        }                return this.deleteProductLocal(productId);

                    }

        try {        }

            const client = window.supabaseConfig.getClient();        return this.deleteProductLocal(productId);

                },

            if (clientData.id) {

                // Actualizar    deleteProductLocal(productId) {

                const { data, error } = await client        const products = JSON.parse(localStorage.getItem('products')) || [];

                    .from('clients')        const filtered = products.filter(p => p.id !== productId);

                    .update({        localStorage.setItem('products', JSON.stringify(filtered));

                        name: clientData.name,        return true;

                        ci: clientData.ci,    },

                        complement: clientData.complement || '',

                        phone: clientData.phone || '',    // CLIENTES (clients table)

                        address: clientData.address || '',    async getClients() {

                        updated_at: new Date().toISOString()        if (this.isSupabaseReady()) {

                    })            try {

                    .eq('id', clientData.id)                const client = window.supabaseConfig.getClient();

                    .select();                const { data, error } = await client

                                    .from('clients')

                if (error) throw error;                    .select('*')

                console.log('✅ Cliente actualizado en Supabase');                    .order('name', { ascending: true });

                return data[0];                

            } else {                if (error) throw error;

                // Crear                return data || [];

                const { data, error } = await client            } catch (error) {

                    .from('clients')                console.error('Error al obtener clientes de Supabase:', error);

                    .insert([{                return JSON.parse(localStorage.getItem('clients')) || [];

                        name: clientData.name,            }

                        ci: clientData.ci,        }

                        complement: clientData.complement || '',        return JSON.parse(localStorage.getItem('clients')) || [];

                        phone: clientData.phone || '',    },

                        address: clientData.address || ''

                    }])    async saveClient(client) {

                    .select();        // SIEMPRE intentar guardar en Supabase primero

                        if (this.isSupabaseReady()) {

                if (error) throw error;            try {

                console.log('✅ Cliente creado en Supabase');                const supabase = window.supabaseConfig.getClient();

                return data[0];                

            }                if (client.id) {

        } catch (error) {                    const { data, error } = await supabase

            console.error('❌ Error al guardar cliente:', error);                        .from('clients')

            throw error;                        .update({

        }                            name: client.name,

    },                            ci: client.ci,

                            complement: client.complement || null,

    async deleteClient(clientId) {                            phone: client.phone || null,

        if (!this.isSupabaseReady()) {                            address: client.address || null,

            throw new Error('Supabase no disponible');                            updated_at: new Date().toISOString()

        }                        })

                                .eq('id', client.id)

        try {                        .select();

            const client = window.supabaseConfig.getClient();                    

            const { error } = await client                    if (error) throw error;

                .from('clients')                    // También guardar en localStorage como backup

                .delete()                    this.saveClientLocal(client);

                .eq('id', clientId);                    return data[0];

                            } else {

            if (error) throw error;                    const { data, error } = await supabase

            console.log('✅ Cliente eliminado de Supabase');                        .from('clients')

            return true;                        .insert([{

        } catch (error) {                            name: client.name,

            console.error('❌ Error al eliminar cliente:', error);                            ci: client.ci,

            throw error;                            complement: client.complement || null,

        }                            phone: client.phone || null,

    },                            address: client.address || null

                        }])

    // ==================== VENTAS ====================                        .select();

    async getSales() {                    

        if (!this.isSupabaseReady()) {                    if (error) throw error;

            console.error('❌ Supabase no disponible');                    // También guardar en localStorage como backup

            return [];                    this.saveClientLocal(data[0]);

        }                    return data[0];

                        }

        try {            } catch (error) {

            const client = window.supabaseConfig.getClient();                console.error('Error al guardar cliente en Supabase:', error);

            const { data, error } = await client                return this.saveClientLocal(client);

                .from('sales')            }

                .select('*')        }

                .order('created_at', { ascending: false });        return this.saveClientLocal(client);

                },

            if (error) throw error;

            return data || [];    saveClientLocal(client) {

        } catch (error) {        const clients = JSON.parse(localStorage.getItem('clients')) || [];

            console.error('❌ Error al obtener ventas:', error);        if (client.id) {

            return [];            const index = clients.findIndex(c => c.id === client.id);

        }            if (index !== -1) {

    },                clients[index] = { ...clients[index], ...client };

            }

    async saveSale(sale) {        } else {

        if (!this.isSupabaseReady()) {            client.id = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;

            throw new Error('Supabase no disponible');            clients.push(client);

        }        }

                localStorage.setItem('clients', JSON.stringify(clients));

        try {        return client;

            const client = window.supabaseConfig.getClient();    },

            

            // Crear venta    // CONFIGURACIONES (settings table)

            const { data, error } = await client    async getSettings(key) {

                .from('sales')        if (this.isSupabaseReady()) {

                .insert([{            try {

                    client_id: sale.client?.id || null,                const client = window.supabaseConfig.getClient();

                    client_name: sale.client?.name || 'Cliente General',                const { data, error } = await client

                    subtotal: sale.subtotal,                    .from('settings')

                    discount: sale.discount || 0,                    .select('value')

                    shipping: sale.shipping || 0,                    .eq('key', key)

                    shipping_address: sale.shippingAddress || '',                    .single();

                    total: sale.total,                

                    payment_method: sale.paymentMethod,                if (error) throw error;

                    user_name: sale.user                return data ? data.value : null;

                }])            } catch (error) {

                .select();                console.error('Error al obtener configuración de Supabase:', error);

                            return JSON.parse(localStorage.getItem(key));

            if (error) throw error;            }

                    }

            // Guardar items de la venta        return JSON.parse(localStorage.getItem(key));

            if (sale.items && sale.items.length > 0) {    },

                const items = sale.items.map(item => ({

                    sale_id: data[0].id,    async saveSettings(key, value) {

                    product_id: item.id,        if (this.isSupabaseReady()) {

                    product_name: item.name,            try {

                    quantity: item.quantity,                const client = window.supabaseConfig.getClient();

                    price: item.price                const { data, error } = await client

                }));                    .from('settings')

                                    .upsert({

                const { error: itemsError } = await client                        key: key,

                    .from('sale_items')                        value: value,

                    .insert(items);                        updated_at: new Date().toISOString()

                                    })

                if (itemsError) throw itemsError;                    .select();

            }                

                            if (error) throw error;

            console.log('✅ Venta guardada en Supabase');                return data[0];

            return data[0];            } catch (error) {

        } catch (error) {                console.error('Error al guardar configuración en Supabase:', error);

            console.error('❌ Error al guardar venta:', error);                localStorage.setItem(key, JSON.stringify(value));

            throw error;                return value;

        }            }

    },        }

        localStorage.setItem(key, JSON.stringify(value));

    // ==================== CONFIGURACIONES ====================        return value;

    async getSettings() {    },

        if (!this.isSupabaseReady()) {

            console.error('❌ Supabase no disponible');    // ======================

            return {};    // Realtime (Supabase)

        }    // ======================

            _realtimeSubs: [],

        try {

            const client = window.supabaseConfig.getClient();    startRealtime() {

            const { data, error } = await client        if (!this.isSupabaseReady()) return;

                .from('settings')        try {

                .select('*')            const client = window.supabaseConfig.getClient();

                .limit(1)

                .single();            // Suscribirse a tablas que necesitamos sincronizar

                        const tables = ['users', 'products', 'clients', 'sales', 'sale_items', 'settings'];

            if (error) {

                // Si no existe, crear settings por defecto            tables.forEach(table => {

                const defaultSettings = {                const subscription = client

                    company_name: 'AIJMIROSHOP',                    .channel('public:' + table)

                    ticket_subtitle: 'Sistema de Gestión',                    .on('postgres_changes', { event: '*', schema: 'public', table: table }, payload => {

                    ticket_footer: '¡Gracias por su compra!',                        const detail = { table, event: payload.eventType, record: payload.new || payload.old };

                    ticket_start_number: 1                        // Emitir evento global

                };                        window.dispatchEvent(new CustomEvent('realtime-change', { detail }));

                                    })

                const { data: newData, error: insertError } = await client                    .subscribe(status => {

                    .from('settings')                        // status puede ser SUBSCRIBED, ERROR, etc.

                    .insert([defaultSettings])                        console.log('Realtime', table, status);

                    .select()                    });

                    .single();

                                this._realtimeSubs.push(subscription);

                if (insertError) throw insertError;            });

                return newData;        } catch (err) {

            }            console.error('Error al iniciar realtime:', err);

                    }

            return data;    },

        } catch (error) {

            console.error('❌ Error al obtener configuración:', error);    stopRealtime() {

            return {};        try {

        }            const client = window.supabaseConfig.getClient();

    },            this._realtimeSubs.forEach(sub => {

                try { client.removeChannel(sub); } catch (e) { /* ignore */ }

    async saveSettings(settings) {            });

        if (!this.isSupabaseReady()) {            this._realtimeSubs = [];

            throw new Error('Supabase no disponible');        } catch (err) {

        }            console.warn('Error al detener realtime', err);

                }

        try {    }

            const client = window.supabaseConfig.getClient();};

            

            const { data, error } = await client// Hacer disponible globalmente

                .from('settings')window.StorageAPI = StorageAPI;

                .upsert([{

                    id: settings.id || 1,console.log('📦 Storage API cargada correctamente');

                    company_name: settings.companyName || settings.company_name,
                    ticket_subtitle: settings.ticketSubtitle || settings.ticket_subtitle,
                    ticket_footer: settings.ticketFooter || settings.ticket_footer,
                    ticket_start_number: settings.ticketStartNumber || settings.ticket_start_number,
                    updated_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            console.log('✅ Configuración guardada en Supabase');
            return data[0];
        } catch (error) {
            console.error('❌ Error al guardar configuración:', error);
            throw error;
        }
    },

    // ==================== REALTIME ====================
    startRealtime() {
        if (!this.isSupabaseReady()) {
            console.error('❌ No se puede iniciar Realtime: Supabase no disponible');
            return;
        }

        const client = window.supabaseConfig.getClient();
        const tables = ['users', 'products', 'clients', 'sales', 'sale_items', 'settings'];

        tables.forEach(table => {
            const channel = client
                .channel(`public:${table}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: table },
                    (payload) => {
                        console.log(`🔄 Cambio en ${table}:`, payload);
                        // Emitir evento personalizado para que los módulos se actualicen
                        window.dispatchEvent(new CustomEvent('realtime-change', { 
                            detail: { table, payload }
                        }));
                    }
                )
                .subscribe((status) => {
                    console.log(`Realtime ${table} ${status}`);
                });

            this._realtimeSubs.push(channel);
        });

        console.log('🔁 StorageAPI realtime iniciado');
    },

    stopRealtime() {
        this._realtimeSubs.forEach(sub => {
            if (sub && sub.unsubscribe) {
                sub.unsubscribe();
            }
        });
        this._realtimeSubs = [];
        console.log('⏹️ StorageAPI realtime detenido');
    }
};

// Exportar globalmente
window.StorageAPI = StorageAPI;
console.log('✅ Storage API cargada correctamente (100% Supabase - Sin localStorage)');
