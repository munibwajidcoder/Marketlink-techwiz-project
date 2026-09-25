import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus as apiUpdateOrderStatus } from '../services/api';
import {
  X, ShoppingBag, Clock, CheckCircle2, AlertCircle, Star,
  QrCode, MapPin, RotateCcw, XCircle, ChevronRight, Leaf,
  BarChart2, Package, Calendar, TrendingUp
} from 'lucide-react';

const DEMO_ORDERS = [
  {
    orderId: 'ML-887234',
    status: 'Ready for Pickup',
    statusColor: 'emerald',
    placedAt: '2025-09-20',
    pickupSlot: 'Sunday, 10:00 AM – 11:00 AM',
    market: 'Clifton Sunday Market',
    items: [
      { name: 'Heirloom Tomatoes', qty: 2, unit: 'kg', price: 380, farmer: 'Chaudhry Riaz' },
      { name: 'Wild Sidr Honey', qty: 1, unit: 'jar', price: 1200, farmer: 'Malir Bio Farms' },
    ],
    total: 1960,
  },
  {
    orderId: 'ML-774120',
    status: 'Placed',
    statusColor: 'blue',
    placedAt: '2025-09-18',
    pickupSlot: 'Sunday, 9:00 AM – 10:00 AM',
    market: 'DHA Phase 6 Weekend Market',
    items: [
      { name: 'Organic Spinach', qty: 1, unit: 'bundle', price: 120, farmer: 'Riverbend Farms' },
      { name: 'Fresh Desi Eggs', qty: 2, unit: 'dozen', price: 480, farmer: 'Riverbend Farms' },
    ],
    total: 1080,
  },
  {
    orderId: 'ML-663055',
    status: 'Completed',
    statusColor: 'slate',
    placedAt: '2025-09-07',
    pickupSlot: 'Sunday, 11:00 AM – 12:00 PM',
    market: 'Clifton Sunday Market',
    items: [
      { name: 'Guava (Amrood)', qty: 3, unit: 'kg', price: 200, farmer: 'Chaudhry Riaz' },
    ],
    total: 600,
  },
  {
    orderId: 'ML-551987',
    status: 'Cancelled',
    statusColor: 'red',
    placedAt: '2025-08-31',
    pickupSlot: 'Sunday, 10:00 AM – 11:00 AM',
    market: 'Clifton Sunday Market',
    items: [
      { name: 'Organic Milk', qty: 2, unit: 'litre', price: 250, farmer: 'Malir Bio Farms' },
    ],
    total: 500,
  },
];

const STATUS_STYLES = {
  'Ready for Pickup': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  'Placed': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  'Completed': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  'Cancelled': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
};

export default function CustomerDashboard({ isOpen, onClose, currentUser, onReorder, showToast, onNavigate }) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'history' | 'favorites'
  const [orders, setOrders] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (isOpen) {
      getOrders()
        .then(({ data }) => {
          // Filter only this customer's orders if currentUser exists, else show all (or handle accordingly)
          const myOrders = currentUser?._id
            ? data.filter(o => o.customer_id === currentUser._id || o.customer_id?._id === currentUser._id || o.customer_id === currentUser.id)
            : data;
          
          // Map to match frontend structure
          const mapped = myOrders.map(o => ({
            orderId: o._id || o.orderId,
            status: o.order_status === 'placed' ? 'Placed' 
                  : o.order_status === 'ready' ? 'Ready for Pickup'
                  : o.order_status === 'completed' ? 'Completed'
                  : o.order_status === 'cancelled' ? 'Cancelled'
                  : 'Placed',
            placedAt: o.order_date || new Date().toISOString(),
            pickupSlot: o.pickup_time_slot || 'Sunday',
            total: o.total_amount,
            items: o.products ? o.products.map(p => ({
              name: p.product_id?.name || 'Product',
              qty: p.quantity,
              price: p.price,
              farmer: p.product_id?.farmer_id?.name || 'Farmer'
            })) : []
          }));
          setOrders(mapped.length > 0 ? mapped : DEMO_ORDERS);
        })
        .catch(() => setOrders(DEMO_ORDERS))
        .finally(() => setLoadingOrders(false));
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const activeOrders = orders.filter(o => o.status === 'Placed' || o.status === 'Ready for Pickup');
  const historyOrders = orders.filter(o => o.status === 'Completed' || o.status === 'Cancelled');

  const handleCancel = async (orderId) => {
    setCancellingId(orderId);
    try {
      // call real backend
      await apiUpdateOrderStatus(orderId, 'cancelled');
      setOrders(prev => prev.map(o =>
        o.orderId === orderId ? { ...o, status: 'Cancelled' } : o
      ));
      showToast && showToast(`Order #${orderId} cancelled successfully.`);
    } catch (err) {
      showToast && showToast(`Failed to cancel order #${orderId}.`);
    } finally {
      setCancellingId(null);
    }
  };

  const handleReorder = (order) => {
    onReorder && onReorder(order);
    showToast && showToast(`Items from #${order.orderId} added back to basket!`);
    onClose();
  };

  const totalSpent = orders.filter(o => o.status === 'Completed').reduce((s, o) => s + o.total, 0);

  const tabs = [
    { id: 'orders', label: 'My Orders', count: activeOrders.length },
    { id: 'history', label: 'Order History', count: historyOrders.length },
  ];

  const OrderCard = ({ order }) => {
    const st = STATUS_STYLES[order.status] || STATUS_STYLES['Placed'];
    const canCancel = order.status === 'Placed';

    return (
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
        {/* Card Header */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-xs">#{order.orderId}</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
                {order.status}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Placed {order.placedAt}
            </div>
          </div>
          <div className="text-right">
            <div className="font-extrabold text-slate-900 text-sm">PKR {order.total.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400">Pay at stall</div>
          </div>
        </div>

        {/* Items */}
        <div className="px-3.5 py-3 space-y-1.5">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Leaf className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="font-bold">{item.qty}× {item.name}</span>
                <span className="text-slate-400">({item.unit})</span>
              </div>
              <span className="font-bold text-slate-600">PKR {(item.price * item.qty).toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Pickup Info */}
        <div className="px-3.5 pb-3 flex items-start gap-1.5 text-[11px] text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
          <span>{order.market} — {order.pickupSlot}</span>
        </div>

        {/* QR / Actions */}
        <div className="px-3.5 pb-3.5 flex items-center gap-2">
          {order.status === 'Ready for Pickup' && (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-emerald-800 font-extrabold text-[11px]">
              <QrCode className="w-3.5 h-3.5" /> Show QR at Stall
            </div>
          )}
          {canCancel && (
            <button
              onClick={() => handleCancel(order.orderId)}
              disabled={cancellingId === order.orderId}
              className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-red-700 font-extrabold text-[11px] cursor-pointer hover:bg-red-100 transition disabled:opacity-60"
            >
              {cancellingId === order.orderId ? (
                <span className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              Cancel Order
            </button>
          )}
          {(order.status === 'Completed' || order.status === 'Cancelled') && (
            <button
              onClick={() => handleReorder(order)}
              className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-extrabold text-[11px] cursor-pointer hover:bg-slate-200 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reorder
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 p-5 text-white shrink-0 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer transition">
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-full ${currentUser?.avatarBg || 'bg-emerald-600'} text-white font-extrabold text-lg flex items-center justify-center shadow`}>
              {currentUser?.avatar || 'A'}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white" style={{ color: '#fff' }}>
                {currentUser?.name || 'My Dashboard'}
              </h2>
              <p className="text-emerald-300 text-[11px] font-bold">{currentUser?.role || 'Customer'} · {currentUser?.locality || 'Karachi'}</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { icon: <Package className="w-3.5 h-3.5" />, label: 'Active Orders', val: activeOrders.length },
              { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Completed', val: historyOrders.filter(o=>o.status==='Completed').length },
              { icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Total Spent', val: `PKR ${totalSpent.toLocaleString()}` },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-2.5 text-center border border-white/10">
                <div className="flex items-center justify-center gap-1 text-emerald-300 mb-0.5">{stat.icon}</div>
                <div className="font-extrabold text-white text-sm">{stat.val}</div>
                <div className="text-[9px] text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 shrink-0 bg-slate-50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-xs font-extrabold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? 'text-emerald-700 border-b-2 border-emerald-600 bg-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {activeTab === 'orders' ? (
            activeOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto" />
                <p className="font-bold">No active orders</p>
                <p className="text-[11px]">Browse markets and place a pre-order to see it here.</p>
                <button
                  onClick={() => { onClose(); onNavigate && onNavigate('browse-markets'); }}
                  className="mt-2 btn-primary text-xs py-2 px-5 cursor-pointer"
                >
                  Browse Markets
                </button>
              </div>
            ) : (
              activeOrders.map(order => <OrderCard key={order.orderId} order={order} />)
            )
          ) : (
            /* ORDER HISTORY TAB */
            historyOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Clock className="w-10 h-10 mx-auto" />
                <p className="font-bold">No past orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                  Past Orders — Click "Reorder" to quickly re-add items to basket
                </div>
                {historyOrders.map(order => <OrderCard key={order.orderId} order={order} />)}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
