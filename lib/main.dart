import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shamsi_date/shamsi_date.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MoneyTrackerApp());
}

class MoneyTrackerApp extends StatefulWidget {
  const MoneyTrackerApp({super.key});

  @override
  State<MoneyTrackerApp> createState() => _MoneyTrackerAppState();
}

class _MoneyTrackerAppState extends State<MoneyTrackerApp> {
  bool _isDarkMode = false;
  bool _isPremium = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _isDarkMode = prefs.getBool('is_dark_mode') ?? false;
      _isPremium = prefs.getBool('is_premium') ?? false;
    });
  }

  void toggleTheme(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _isDarkMode = value;
    });
    await prefs.setBool('is_dark_mode', value);
  }

  void unlockPremium() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _isPremium = true;
    });
    await prefs.setBool('is_premium', true);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'مدیریت مالی پیشرفته',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.light,
        primarySwatch: Colors.teal,
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        primarySwatch: Colors.teal,
        useMaterial3: typeIsDark(true),
      ),
      themeMode: _isDarkMode ? ThemeMode.dark : ThemeMode.light,
      home: HomeScreen(
        isDarkMode: _isDarkMode,
        onThemeChanged: toggleTheme,
        isPremium: _isPremium,
        onUnlockPremium: unlockPremium,
      ),
    );
  }
  
  bool typeIsDark(bool val) => val;
}

// مدل‌های داده
class Transaction {
  final String title;
  final double amount;
  final bool isIncome;
  final String date;
  Transaction({required this.title, required this.amount, required this.isIncome, required this.date});
  Map<String, dynamic> toJson() => {'title': title, 'amount': amount, 'isIncome': isIncome, 'date': date};
  factory Transaction.fromJson(Map<String, dynamic> json) => Transaction(title: json['title'], amount: json['amount'], isIncome: json['isIncome'], date: json['date']);
}

class CheckItem {
  final String bankName;
  final String checkNumber;
  final double amount;
  final String dueDate;
  final bool isReceived; // true: دریافتی، false: صادرشده
  CheckItem({required this.bankName, required this.checkNumber, required this.amount, required this.dueDate, required this.isReceived});
  Map<String, dynamic> toJson() => {'bankName': bankName, 'checkNumber': checkNumber, 'amount': amount, 'dueDate': dueDate, 'isReceived': isReceived};
  factory CheckItem.fromJson(Map<String, dynamic> json) => CheckItem(bankName: json['bankName'], checkNumber: json['checkNumber'], amount: json['amount'], dueDate: json['dueDate'], isReceived: json['isReceived']);
}

class DebtItem {
  final String personName;
  final double amount;
  final bool isIOWebt; // true: به من بدهکار است، من طلبکارم / false: من بدهکارم
  final String dueDate;
  DebtItem({required this.personName, required this.amount, required this.isIOWebt, required this.dueDate});
  Map<String, dynamic> toJson() => {'personName': personName, 'amount': amount, 'isIOWebt': isIOWebt, 'dueDate': dueDate};
  factory DebtItem.fromJson(Map<String, dynamic> json) => DebtItem(personName: json['personName'], amount: json['amount'], isIOWebt: json['isIOWebt'], dueDate: json['dueDate']);
}

class HomeScreen extends StatefulWidget {
  final bool isDarkMode;
  final Function(bool) onThemeChanged;
  final bool isPremium;
  final VoidCallback onUnlockPremium;

  const HomeScreen({
    super.key,
    required this.isDarkMode,
    required this.onThemeChanged,
    required this.isPremium,
    required this.onUnlockPremium,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  List<Transaction> _transactions = [];
  List<CheckItem> _checks = [];
  List<DebtItem> _debts = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final prefs = await SharedPreferences.getInstance();
    
    // تراکنش‌ها
    final String? txData = prefs.getString('transactions');
    if (txData != null) {
      final List decoded = jsonDecode(txData);
      setState(() {
        _transactions = decoded.map((e) => Transaction.fromJson(e)).toList();
      });
    }

    // چک‌ها
    final String? checkData = prefs.getString('checks');
    if (checkData != null) {
      final List decoded = jsonDecode(checkData);
      setState(() {
        _checks = decoded.map((e) => CheckItem.fromJson(e)).toList();
      });
    }

    // بدهی‌ها
    final String? debtData = prefs.getString('debts');
    if (debtData != null) {
      final List decoded = jsonDecode(debtData);
      setState(() {
        _debts = decoded.map((e) => DebtItem.fromJson(e)).toList();
      });
    }
  }

  Future<void> _saveAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('transactions', jsonEncode(_transactions.map((e) => e.toJson()).toList()));
    await prefs.setString('checks', jsonEncode(_checks.map((e) => e.toJson()).toList()));
    await prefs.setString('debts', jsonEncode(_debts.map((e) => e.toJson()).toList()));
  }

  // محاسبات مالی
  double get _totalBalance {
    double b = 0;
    for (var tx in _transactions) {
      b += tx.isIncome ? tx.amount : -tx.amount;
    }
    return b;
  }

  void _simulateBazaarPurchase() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('پرداخت درون‌برنامه‌ای بازار'),
        content: const Text('برای فعال‌سازی بخش مدیریت چک و بدهی‌ها، مبلغ ۵۰,۰۰۰ تومان از طریق درگاه کافه‌بازار پرداخت شود؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('انصراف')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white),
            onPressed: () {
              Navigator.pop(context);
              widget.onUnlockPremium();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('پرداخت با موفقیت انجام شد! امکانات ویژه فعال گردید.')),
              );
            },
            child: const Text('پرداخت و فعال‌سازی'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> pages = [
      _buildTransactionsTab(),
      widget.isPremium ? _buildChecksTab() : _buildLockedView('بخش مدیریت چک‌ها'),
      widget.isPremium ? _buildDebtsTab() : _buildLockedView('بخش مدیریت بدهی‌ها'),
      _buildSettingsTab(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('مدیریت مالی، چک و بدهی'),
        centerTitle: true,
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Colors.teal,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet), label: 'مالی'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long), label: 'چک‌ها'),
          BottomNavigationBarItem(icon: Icon(Icons.money_off), label: 'بدهی‌ها'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'تنظیمات'),
        ],
      ),
    );
  }

  // نمای قفل شده برای کاربران رایگان
  Widget _buildLockedView(String sectionName) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.lock, size: 80, color: Colors.orange),
            const SizedBox(height: 16),
            Text(
              '$sectionName قفل است',
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'این بخش اختصاصی است و برای دسترسی به آن باید نسخه کامل را از طریق کافه‌بازار خریداری کنید.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.teal,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              onPressed: _simulateBazaarPurchase,
              icon: const Icon(Icons.shopping_bag),
              label: const Text('خرید از کافه‌بازار (باز کردن قفل)'),
            ),
          ],
        ),
      ),
    );
  }

  // تب مالی
  Widget _buildTransactionsTab() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          margin: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [Colors.teal.shade700, Colors.teal.shade400]),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              const Text('موجودی کل حساب', style: TextStyle(color: Colors.white70)),
              const SizedBox(height: 8),
              Text('${_totalBalance.toStringAsFixed(0)} تومان', style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        Expanded(
          child: _transactions.isEmpty
              ? const Center(child: Text('هیچ تراکنشی ثبت نشده است.'))
              : ListView.builder(
                  itemCount: _transactions.length,
                  itemBuilder: (context, index) {
                    final tx = _transactions[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      child: ListTile(
                        leading: Icon(tx.isIncome ? Icons.arrow_downward : Icons.arrow_upward, color: tx.isIncome ? Colors.green : Colors.red),
                        title: Text(tx.title),
                        subtitle: Text(tx.date),
                        trailing: Text('${tx.isIncome ? '+' : '-'}${tx.amount.toStringAsFixed(0)}', style: TextStyle(color: tx.isIncome ? Colors.green : Colors.red, fontWeight: FontWeight.bold)),
                      ),
                    );
                  },
                ),
        ),
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(50)),
            onPressed: _showAddTransactionDialog,
            icon: const Icon(Icons.add),
            label: const Text('افزودن تراکنش جدید'),
          ),
        ),
      ],
    );
  }

  void _showAddTransactionDialog() {
    final titleC = TextEditingController();
    final amountC = TextEditingController();
    bool isIncome = false;
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDState) => AlertDialog(
          title: const Text('ثبت تراکنش'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: titleC, decoration: const InputDecoration(labelText: 'عنوان')),
              TextField(controller: amountC, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'مبلغ (تومان)')),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ChoiceChip(label: const Text('هزینه'), selected: !isIncome, onSelected: (s) => setDState(() => isIncome = false)),
                  const SizedBox(width: 10),
                  ChoiceChip(label: const Text('درآمد'), selected: isIncome, onSelected: (s) => setDState(() => isIncome = true)),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('انصراف')),
            ElevatedButton(
              onPressed: () {
                if (titleC.text.isNotEmpty && double.tryParse(amountC.text) != null) {
                  final now = Jalali.now();
                  setState(() {
                    _transactions.insert(0, Transaction(title: titleC.text, amount: double.parse(amountC.text), isIncome: isIncome, date: '${now.year}/${now.month}/${now.day}'));
                  });
                  _saveAll();
                  Navigator.pop(context);
                }
              },
              child: const Text('ثبت'),
            ),
          ],
        ),
      ),
    );
  }

  // تب چک‌ها (ویژه نسخه پلاس)
  Widget _buildChecksTab() {
    return Column(
      children: [
        Expanded(
          child: _checks.isEmpty
              ? const Center(child: Text('هیچ چکی ثبت نشده است.'))
              : ListView.builder(
                  itemCount: _checks.length,
                  itemBuilder: (context, index) {
                    final c = _checks[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      child: ListTile(
                        leading: Icon(Icons.payment, color: c.isReceived ? Colors.blue : Colors.purple),
                        title: Text('بانک: ${c.bankName} - شماره: ${c.checkNumber}'),
                        subtitle: Text('سررسید: ${c.dueDate} | ${c.isReceived ? "چک دریافتی" : "چک صادرشده"}'),
                        trailing: Text('${c.amount.toStringAsFixed(0)} ت', style: const TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    );
                  },
                ),
        ),
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(50)),
            onPressed: _showAddCheckDialog,
            icon: const Icon(Icons.add),
            label: const Text('ثبت چک جدید'),
          ),
        ),
      ],
    );
  }

  void _showAddCheckDialog() {
    final bankC = TextEditingController();
    final numC = TextEditingController();
    final amountC = TextEditingController();
    final dateC = TextEditingController();
    bool isReceived = true;
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDState) => AlertDialog(
          title: const Text('ثبت چک جدید'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: bankC, decoration: const InputDecoration(labelText: 'نام بانک')),
                TextField(controller: numC, decoration: const InputDecoration(labelText: 'شماره چک')),
                TextField(controller: amountC, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'مبلغ')),
                TextField(controller: dateC, decoration: const InputDecoration(labelText: 'تاریخ سررسید (مثلاً 1405/08/15)')),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ChoiceChip(label: const Text('دریافتی'), selected: isReceived, onSelected: (s) => setDState(() => isReceived = true)),
                    const SizedBox(width: 10),
                    ChoiceChip(label: const Text('صادرشده'), selected: !isReceived, onSelected: (s) => setDState(() => isReceived = false)),
                  ],
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('انصراف')),
            ElevatedButton(
              onPressed: () {
                if (bankC.text.isNotEmpty && double.tryParse(amountC.text) != null) {
                  setState(() {
                    _checks.add(CheckItem(bankName: bankC.text, checkNumber: numC.text, amount: double.parse(amountC.text), dueDate: dateC.text, isReceived: isReceived));
                  });
                  _saveAll();
                  Navigator.pop(context);
                }
              },
              child: const Text('ثبت'),
            ),
          ],
        ),
      ),
    );
  }

  // تب بدهی‌ها (ویژه نسخه پلاس)
  Widget _buildDebtsTab() {
    return Column(
      children: [
        Expanded(
          child: _debts.isEmpty
              ? const Center(child: Text('هیچ بدهی یا طلبی ثبت نشده است.'))
              : ListView.builder(
                  itemCount: _debts.length,
                  itemBuilder: (context, index) {
                    final d = _debts[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      child: ListTile(
                        leading: Icon(d.isIOWebt ? Icons.arrow_circle_down : Icons.arrow_circle_up, color: d.isIOWebt ? Colors.green : Colors.red),
                        title: Text(d.personName),
                        subtitle: Text('موعد تسویه: ${d.dueDate} | ${d.isIOWebt ? "به من بدهکار است (طلبکارم)" : "بدهکارم"}'),
                        trailing: Text('${d.amount.toStringAsFixed(0)} ت', style: TextStyle(color: d.isIOWebt ? Colors.green : Colors.red, fontWeight: FontWeight.bold)),
                      ),
                    );
                  },
                ),
        ),
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(50)),
            onPressed: _showAddDebtDialog,
            icon: const Icon(Icons.add),
            label: const Text('ثبت بدهی یا طلب جدید'),
          ),
        ),
      ],
    );
  }

  void _showAddDebtDialog() {
    final nameC = TextEditingController();
    final amountC = TextEditingController();
    final dateC = TextEditingController();
    bool isIOWebt = true;
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDState) => AlertDialog(
          title: const Text('ثبت بدهی / طلب'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: nameC, decoration: const InputDecoration(labelText: 'نام شخص')),
                TextField(controller: amountC, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'مبلغ')),
                TextField(controller: dateC, decoration: const InputDecoration(labelText: 'تاریخ تسویه')),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ChoiceChip(label: const Text('طلبکارم (به من بدهکار است)'), selected: isIOWebt, onSelected: (s) => setDState(() => isIOWebt = true)),
                    const SizedBox(width: 10),
                    ChoiceChip(label: const Text('بدهکارم'), selected: !isIOWebt, onSelected: (s) => setDState(() => isIOWebt = false)),
                  ],
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('انصراف')),
            ElevatedButton(
              onPressed: () {
                if (nameC.text.isNotEmpty && double.tryParse(amountC.text) != null) {
                  setState(() {
                    _debts.add(DebtItem(personName: nameC.text, amount: double.parse(amountC.text), isIOWebt: isIOWebt, dueDate: dateC.text));
                  });
                  _saveAll();
                  Navigator.pop(context);
                }
              },
              child: const Text('ثبت'),
            ),
          ],
        ),
      ),
    );
  }

  // تب تنظیمات
  Widget _buildSettingsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('تنظیمات برنامه', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const Divider(),
        SwitchListTile(
          title: const Text('حالت شب (تاریک)'),
          subtitle: const Text('تغییر تم برنامه به حالت تیره'),
          value: widget.isDarkMode,
          onChanged: widget.onThemeChanged,
          secondary: const Icon(Icons.dark_mode),
        ),
        const Divider(),
        ListTile(
          leading: const Icon(Icons.star, color: Colors.amber),
          title: const Text('وضعیت نسخه برنامه'),
          subtitle: Text(widget.isPremium ? 'نسخه کامل و پیشرفته (فعال)' : 'نسخه رایگان (بخش چک و بدهی قفل است)'),
          trailing: widget.isPremium
              ? const Chip(label: Text('پریمیوم'), backgroundColor: Colors.teal, labelStyle: TextStyle(color: Colors.white))
              : ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white),
                  onPressed: _simulateBazaarPurchase,
                  child: const Text('خرید نسخه کامل'),
                ),
        ),
      ],
    );
  }
}
