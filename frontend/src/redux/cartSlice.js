import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

// =======================================================
// FETCH CART
// =======================================================
export const fetchCart = createAsyncThunk(
    'cart/fetchCart',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/cart');
            return response.data.items || response.data;
        } catch {
            return rejectWithValue("Failed to load cart.");
        }
    }
);

// =======================================================
// ADD ITEM TO CART  ✅ FIXED
// =======================================================
export const addItemToCart = createAsyncThunk(
    'cart/addItemToCart',
    async (_id, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/cart/add', { mockTestId: _id });
            return response.data.newItem;
        } catch (error) {
            return rejectWithValue("Failed to add to cart.");
        }
    }
);


// =======================================================
// REMOVE ITEM FROM CART  ✅ FIXED
// =======================================================
export const removeItemFromCart = createAsyncThunk(
    'cart/removeItemFromCart',
    async (_id, { rejectWithValue }) => {

        if (!_id) {
            return rejectWithValue("Missing ID for removal.");
        }

        try {
            await api.delete(`/api/cart/remove/${_id}`);
            return _id;
        } catch {
            return rejectWithValue("Failed to remove item.");
        }
    }
);

// =======================================================
// SLICE
// =======================================================
const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        cartItems: [],
        status: 'idle',
        error: null,
    },

    reducers: {
        clearCart: (state) => {
            state.cartItems = [];
            state.status = 'idle';
            state.error = null;
        }
    },

    extraReducers: (builder) => {
        builder

            // FETCH CART
            .addCase(fetchCart.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.status = 'idle';
                state.cartItems = action.payload;
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })

            // ADD TO CART
            .addCase(addItemToCart.fulfilled, (state, action) => {
                const newItem = action.payload;
                if (!state.cartItems.some(i => i._id === newItem._id)) {
                    state.cartItems.push(newItem);
                }
            })

            // REMOVE FROM CART
            .addCase(removeItemFromCart.fulfilled, (state, action) => {
                const id = action.payload;
                state.cartItems = state.cartItems.filter(i => i._id !== id);
            });
    },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
