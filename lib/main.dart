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
    setState(() => _isDarkMode = value);
    await prefs.setBool('is_dark_mode', value);
  }

  void unlockPremium() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() => _isPremium = true);
    await prefs.setBool('is_premium', true);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'مدیریت مالی هوشمند',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.light,
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal, brightness: Brightness.light),
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal, brightness: Brightness.dark),
        useMaterial3: true,
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
}

// مدل‌ها
class BankAccount {
  final String name;
  double balance;
  BankAccount({required this.name, required this.balance});
  Map<String, dynamic> toJson() => {'name': name, 'balance': balance};
  factory BankAccount.fromJson(Map<String, dynamic> json) => BankAccount(name: json['name'], balance: json['balance']);
}

class Transaction {
  final String id;
  final String title;
  final double amount;
  final bool isIncome;
  final String accountName;
  final String category;
  final String date;
  Transaction({required this.id, required this.title, required this.amount, required this.isIncome, required this.accountName, required this.category, required this.date});
  
  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'amount': amount,
        'isIncome': isIncome,
        'accountName': accountName,
        'category': category,
        'date': date,
      };

  factory Transaction.fromJson(Map<String, dynamic> json) => Transaction(
        id: json['id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
        title: json['title'],
        amount: json['amount'],
        isIncome: json['isIncome'],
        accountName: json['accountName'] ?? 'کیف پول نقدی',
        category: json['category'] ?? (json['isIncome'] ? 'سایر درآمدها' : 'سایر هزینه‌ها'),
        date: json['date'],
      );
}

class CheckItem {
  final String bankName, checkNumber, dueDate;
  final double amount;
  final bool isReceived;
  CheckItem({required this.bankName, required this.checkNumber, required this.amount, required this.dueDate, required this.isReceived});
  Map<String, dynamic> toJson() => {'bankName': bankName, 'checkNumber': checkNumber, 'amount': amount, 'dueDate': dueDate, 'isReceived': isReceived};
  factory CheckItem.fromJson(Map<String, dynamic> json) => CheckItem(bankName: json['bankName'], checkNumber: json['checkNumber'], amount: json['amount'], dueDate: json['dueDate'], isReceived: json['isReceived']);
}

class DebtItem {
  final String personName, dueDate;
  final double amount;
  final bool isIOWebt;
  DebtItem({required this.personName, required this.amount, required this.isIOWebt, required this.dueDate});
  Map<String, dynamic> toJson() => {'personName': personName, 'amount': amount, 'isIOWebt': isIOWebt, 'dueDate': dueDate};
  factory DebtItem.fromJson(Map<String, dynamic> json) => DebtItem(personName: json['personName'], amount: json['amount'], isIOWebt: json['isIOWebt'], dueDate: json['dueDate']);
}

class HomeScreen extends StatefulWidget {
  final bool isDarkMode;
  final Function(bool) onThemeChanged;
  final bool isPremium;
  final VoidCallback onUnlockPremium;

  const HomeScreen({super.key, required this.isDarkMode, required this.onThemeChanged, required this.isPremium, required this.onUnlockPremium});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  List<BankAccount> _accounts = [BankAccount(name: 'کیف پول نقدی', balance: 0)];
  List<Transaction> _transactions = [];
  List<CheckItem> _checks = [];
  List<DebtItem> _debts = [];

  // دسته‌بندی‌های پیش‌فرض گسترده
  List<String> expenseCategories = [
    'خوراک و سوپرمارکت',
    'مسکن و اجاره',
    'حمل‌ونقل و سوخت',
    'قبض و خدمات',
    'پوشاک و لوازم شخصی',
    'درمان و سلامت',
    'آموزش و کتاب',
    'تفریح، سرگرمی و سفر',
    'رستوران و کافه',
    'قسط و وام',
    'سایر هزینه‌ها'
  ];

  List<String> incomeCategories = [
    'حقوق و دستمزد',
    'پاداش و عیدی',
    'کار آزاد / فریلنسر',
    'سود سرمایه‌گذاری',
    'فروش دارایی',
    'هدیه و پاداش',
    'سایر درآمدها'
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final prefs = await SharedPreferences.getInstance();
    
    final String? accData = prefs.getString('accounts');
    if (accData != null) {
      setState(() => _accounts = (jsonDecode(accData) as List).map((e) => BankAccount.fromJson(e)).toList());
    }

    final String? txData = prefs.getString('transactions');
    if (txData != null) {
      setState(() => _transactions = (jsonDecode(txData) as List).map((e) => Transaction.fromJson(e)).toList());
    }

    final String? checkData = prefs.getString('checks');
    if (checkData != null) {
      setState(() => _checks = (jsonDecode(checkData) as List).map((e) => CheckItem.fromJson(e)).toList());
    }

    final String? debtData = prefs.getString('debts');
    if (debtData != null) {
      setState(() => _debts = (jsonDecode(debtData) as List).map((e) => DebtItem.fromJson(e)).toList());
    }

    final List<String>? savedExpCat = prefs.getStringList('expense_categories');
    if (savedExpCat != null) setState(() => expenseCategories = savedExpCat);

    final List<String>? savedIncCat = prefs.getStringList('income_categories');
    if (savedIncCat != null) setState(() => incomeCategories = savedIncCat);
  }

  Future<void> _saveAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('accounts', jsonEncode(_accounts.map((e) => e.toJson()).toList()));
    await prefs.setString('transactions', jsonEncode(_transactions.map((e) => e.toJson()).toList()));
    await prefs.setString('checks', jsonEncode(_checks.map((e) => e.toJson()).toList()));
    await prefs.setString('debts', jsonEncode(_debts.map((e) => e.toJson()).toList()));
    await prefs.setStringList('expense_categories', expenseCategories);
    await prefs.setStringList('income_categories', incomeCategories);
  }

  double get _totalBalance => _accounts.fold(0.0, (sum, acc) => sum + acc.balance);
  double get _totalIncome => _transactions.where((t) => t.isIncome).fold(0.0, (s, t) => s + t.amount);
  double get _totalExpense => _transactions.where((t) => !t.isIncome).fold(0.0, (s, t) => s + t.amount);

  void _simulateBazaarPurchase() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.shopping_bag, color: Colors.teal),
            SizedBox(width: 8),
            Text('خرید نسخه کامل (بازار)'),
          ],
        ),
        content: const Text('برای باز کردن قفل بخش‌های «چک» و «بدهی‌ها»، ارتقا به نسخه کامل انجام شود؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('انصراف')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white),
            onPressed: () {
              Navigator.pop(context);
              widget.onUnlockPremium();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('پرداخت موفق! امکانات ویژه فعال شد.'), backgroundColor: Colors.teal),
              );
            },
            child: const Text('تایید و پرداخت'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> pages = [
      _buildFinancialTab(),
      _buildChartsTab(),
      widget.isPremium ? _buildChecksTab() : _buildLockedView('مدیریت چک‌ها'),
      widget.isPremium ? _buildDebtsTab() : _buildLockedView('مدیریت بدهی‌ها'),
      _buildPlanningAndTipsTab(),
      _buildSettingsTab(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('مدیریت مالی هوشمند', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: pages[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.wallet_outlined), selectedIcon: Icon(Icons.wallet), label: 'مالی'),
          NavigationDestination(icon: Icon(Icons.bar_chart_outlined), selectedIcon: Icon(Icons.bar_chart), label: 'نمودار'),
          NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: 'چک'),
          NavigationDestination(icon: Icon(Icons.money_off_outlined), selectedIcon: Icon(Icons.money_off), label: 'بدهی'),
          NavigationDestination(icon: Icon(Icons.lightbulb_outline), selectedIcon: Icon(Icons.lightbulb), label: 'آموزش'),
          NavigationDestination(icon: Icon(Icons.settings_outlined), selectedIcon: Icon(Icons.settings), label: 'تنظیمات'),
        ],
      ),
    );
  }

  Widget _buildLockedView(String name) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: Colors.orange.withOpacity(0.1), shape: BoxShape.circle),
              child: const Icon(Icons.lock_rounded, size: 60, color: Colors.orange),
            ),
            const SizedBox(height: 20),
            Text('$name قفل است', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text(
              'با خرید نسخه کامل از کافه‌بازار، به مدیریت پیشرفته چک‌ها و بدهی‌ها دسترسی پیدا کنید.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, height: 1.5),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.teal,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: _simulateBazaarPurchase,
              icon: const Icon(Icons.shopping_bag),
              label: const Text('خرید از کافه‌بازار (ارتقا)'),
            ),
          ],
        ),
      ),
    );
  }

  // ۱. تب مالی
  Widget _buildFinancialTab() {
    return Column(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          margin: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.teal.shade700, Colors.teal.shade400],
              begin: Alignment.topRight,
              end: Alignment.bottomLeft,
            ),
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('موجودی کل تمامی حساب‌ها', style: TextStyle(color: Colors.white70, fontSize: 13)),
              const SizedBox(height: 8),
              Text('${_totalBalance.toStringAsFixed(0)} تومان', style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
              const Padding(padding: EdgeInsets.symmetric(vertical: 12), child: Divider(color: Colors.white24, height: 1)),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.arrow_downward, color: Colors.greenAccent, size: 18),
                      const SizedBox(width: 4),
                      Text('درآمد: +${_totalIncome.toStringAsFixed(0)}', style: const TextStyle(color: Colors.white, fontSize: 13)),
                    ],
                  ),
                  Row(
                    children: [
                      const Icon(Icons.arrow_upward, color: Colors.redAccent, size: 18),
                      const SizedBox(width: 4),
                      Text('هزینه: -${_totalExpense.toStringAsFixed(0)}', style: const TextStyle(color: Colors.white, fontSize: 13)),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('حساب‌های من', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              Row(
                children: [
                  TextButton.icon(
                    onPressed: _showTransferDialog,
                    icon: const Icon(Icons.swap_horiz, size: 18),
                    label: const Text('انتقال وجه'),
                  ),
                  TextButton.icon(
                    onPressed: _showAddAccountDialog,
                    icon: const Icon(Icons.add_circle_outline, size: 18),
                    label: const Text('حساب جدید'),
                  ),
                ],
              )
            ],
          ),
        ),
        SizedBox(
          height: 80,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: _accounts.length,
            itemBuilder: (context, i) => Container(
              width: 150,
              margin: EdgeInsets.only(left: i == 0 ? 16 : 8, right: i == _accounts.length - 1 ? 16 : 0),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.teal.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(_accounts[i].name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13), overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Text('${_accounts[i].balance.toStringAsFixed(0)} ت', style: const TextStyle(fontSize: 12, color: Colors.teal, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Align(alignment: Alignment.centerRight, child: Text('تراکنش‌های اخیر', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.grey))),
        ),
        Expanded(
          child: _transactions.isEmpty
              ? const Center(child: Text('هنوز تراکنشی ثبت نشده است', style: TextStyle(color: Colors.grey)))
              : ListView.builder(
                  itemCount: _transactions.length,
                  itemBuilder: (context, index) {
                    final tx = _transactions[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: Colors.grey.withOpacity(0.2)),
                      ),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: tx.isIncome ? Colors.green.shade50 : Colors.red.shade50,
                          child: Icon(tx.isIncome ? Icons.arrow_downward : Icons.arrow_upward, color: tx.isIncome ? Colors.green : Colors.red),
                        ),
                        title: Text(tx.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('${tx.category} • ${tx.accountName} | ${tx.date}', style: const TextStyle(fontSize: 11)),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '${tx.isIncome ? '+' : '-'}${tx.amount.toStringAsFixed(0)}',
                              style: TextStyle(color: tx.isIncome ? Colors.green : Colors.red, fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            IconButton(
                              icon: const Icon(Icons.edit, size: 18, color: Colors.blue),
                              onPressed: () => _showEditTransactionDialog(tx),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete, size: 18, color: Colors.red),
                              onPressed: () => _deleteTransaction(tx),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.teal,
              foregroundColor: Colors.white,
              minimumSize: const Size.fromHeight(50),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            onPressed: _showAddTransactionDialog,
            icon: const Icon(Icons.add),
            label: const Text('ثبت تراکنش جدید', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
          ),
        ),
      ],
    );
  }

  void _deleteTransaction(Transaction tx) {
    setState(() {
      for (var acc in _accounts) {
        if (acc.name == tx.accountName) {
          acc.balance -= tx.isIncome ? tx.amount : -tx.amount;
        }
      }
      _transactions.removeWhere((t) => t.id == tx.id);
    });
    _saveAll();
  }

  // ۲. تب نمودارها
  Widget _buildChartsTab() {
    double maxVal = (_totalIncome > _totalExpense ? _totalIncome : _totalExpense);
    if (maxVal == 0) maxVal = 1;

    Map<String, double> categoryExpenses = {};
    for (var cat in expenseCategories) {
      double sum = _transactions.where((t) => !t.isIncome && t.category == cat).fold(0.0, (s, t) => s + t.amount);
      if (sum > 0) categoryExpenses[cat] = sum;
    }

    return ListView(
      padding: const EdgeInsets.all(16.0),
      children: [
        const Text('نمودار کلی کل درآمد و هزینه', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        SizedBox(
          height: 200,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text('+${_totalIncome.toStringAsFixed(0)}', style: const TextStyle(fontSize: 11, color: Colors.green, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Container(
                    width: 60,
                    height: (_totalIncome / maxVal) * 130,
                    decoration: BoxDecoration(color: Colors.green, borderRadius: BorderRadius.circular(12)),
                  ),
                  const SizedBox(height: 10),
                  const Text('کل درآمد', style: TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
              Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text('-${_totalExpense.toStringAsFixed(0)}', style: const TextStyle(fontSize: 11, color: Colors.red, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Container(
                    width: 60,
                    height: (_totalExpense / maxVal) * 130,
                    decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(12)),
                  ),
                  const SizedBox(height: 10),
                  const Text('کل هزینه', style: TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            ],
          ),
        ),
        const Divider(height: 40),
        const Text('گزارش هزینه‌ها بر اساس دسته‌بندی', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        categoryExpenses.isEmpty
            ? const Padding(padding: EdgeInsets.all(16.0), child: Text('هنوز هزینه‌دسته‌بندی‌شده‌ای ثبت نشده است.', style: TextStyle(color: Colors.grey)))
            : ...categoryExpenses.entries.map((entry) {
                double percent = _totalExpense > 0 ? (entry.value / _totalExpense) * 100 : 0;
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(entry.key, style: const TextStyle(fontWeight: FontWeight.bold)),
                          Text('${entry.value.toStringAsFixed(0)} تومان (${percent.toStringAsFixed(1)}%)', style: const TextStyle(color: Colors.red, fontSize: 13)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      LinearProgressIndicator(
                        value: percent / 100,
                        backgroundColor: Colors.grey.shade200,
                        color: Colors.redAccent,
                        minHeight: 8,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ],
                  ),
                );
              }),
        const Divider(height: 40),
        const Text('وضعیت و موجودی تفکیکی هر حساب', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        ..._accounts.map((acc) {
          double accIncome = _transactions.where((t) => t.accountName == acc.name && t.isIncome).fold(0.0, (s, t) => s + t.amount);
          double accExpense = _transactions.where((t) => t.accountName == acc.name && !t.isIncome).fold(0.0, (s, t) => s + t.amount);
          return Card(
            margin: const EdgeInsets.symmetric(vertical: 6),
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(acc.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.teal)),
                  const SizedBox(height: 6),
                  Text('موجودی فعلی: ${acc.balance.toStringAsFixed(0)} تومان'),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('درآمد: +$accIncome', style: const TextStyle(color: Colors.green, fontSize: 12)),
                      Text('هزینه: -$accExpense', style: const TextStyle(color: Colors.red, fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  // ۳. تب چک‌ها
  Widget _buildChecksTab() {
    return Column(
      children: [
        Expanded(
          child: _checks.isEmpty
              ? const Center(child: Text('چکی ثبت نشده است'))
              : ListView.builder(
                  itemCount: _checks.length,
                  itemBuilder: (context, i) {
                    final c = _checks[i];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      child: ListTile(
                        leading: const Icon(Icons.receipt, color: Colors.teal),
                        title: Text('بانک: ${c.bankName} (${c.checkNumber})', style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('سررسید: ${c.dueDate} | ${c.isReceived ? "دریافتی" : "صادرشده"}'),
                        trailing: Text('${c.amount.toStringAsFixed(0)} ت', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.teal)),
                      ),
                    );
                  },
                ),
        ),
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(45)),
            onPressed: _showAddCheckDialog,
            icon: const Icon(Icons.add),
            label: const Text('ثبت چک جدید'),
          ),
        ),
      ],
    );
  }

  // ۴. تب بدهی‌ها
  Widget _buildDebtsTab() {
    double totalClaims = _debts.where((d) => d.isIOWebt).fold(0.0, (s, d) => s + d.amount);
    double totalOwed = _debts.where((d) => !d.isIOWebt).fold(0.0, (s, d) => s + d.amount);
    double netBalance = totalClaims - totalOwed;

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.teal.shade50,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.teal.shade200),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Column(
                    children: [
                      const Text('کل طلب‌ها', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      Text('+${totalClaims.toStringAsFixed(0)}', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                  Column(
                    children: [
                      const Text('کل بدهی‌ها', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      Text('-${totalOwed.toStringAsFixed(0)}', style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                ],
              ),
              const Divider(height: 16),
              Text('برایند نهایی: ${netBalance.toStringAsFixed(0)} تومان', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: netBalance >= 0 ? Colors.green : Colors.red)),
            ],
          ),
        ),
        Expanded(
          child: _debts.isEmpty
              ? const Center(child: Text('بدهی یا طلبی ثبت نشده است'))
              : ListView.builder(
                  itemCount: _debts.length,
                  itemBuilder: (context, i) {
                    final d = _debts[i];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      child: ListTile(
                        leading: Icon(d.isIOWebt ? Icons.arrow_circle_down : Icons.arrow_circle_up, color: d.isIOWebt ? Colors.green : Colors.red),
                        title: Text(d.personName, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('موعد: ${d.dueDate} | ${d.isIOWebt ? "طلبکارم" : "بدهکارم"}'),
                        trailing: Text('${d.amount.toStringAsFixed(0)} ت', style: TextStyle(color: d.isIOWebt ? Colors.green : Colors.red, fontWeight: FontWeight.bold)),
                      ),
                    );
                  },
                ),
        ),
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(45)),
            onPressed: _showAddDebtDialog,
            icon: const Icon(Icons.add),
            label: const Text('ثبت بدهی/طلب جدید'),
          ),
        ),
      ],
    );
  }

  // ۵. تب آموزش و هوش مالی
  Widget _buildPlanningAndTipsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('آکادمی آموزش و هوش مالی', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        _buildTipCard('💡 قانون طلایی بودجه‌بندی (۵۰ / ۳۰ / ۲۰)', '۵۰ درصد درآمد برای هزینه‌های ضروری، ۳۰ درصد برای خواسته‌ها و تفریح، و ۲۰ درصد برای پس‌انداز و سرمایه‌گذاری.'),
        _buildTipCard('🚀 ترفند طلایی کنترل خرید هیجانی', 'قبل از خرید کالاهای غیرضروری، قانون ۲۴ ساعت را اجرا کنید؛ یک روز صبر کنید، اگر هنوز نیاز داشتید اقدام به خرید کنید.'),
        _buildTipCard('🛡️ صندوق اضطراری (قانون ۶ ماهه)', 'همیشه معادل هزینه ۶ ماه زندگی‌تان را به عنوان پس‌انداز اضطراری در جایی امن نگهداری کنید تا در روزهای سخت نیازی به وام با سود بالا نداشته باشید.'),
        _buildTipCard('📈 قدرت جادویی سود مرکب', 'آلبرت اینشتین سود مرکب را عجایب هشتم دنیا می‌داند! حتی پس‌اندازهای کوچک ماهانه اگر در جای درست سرمایه‌گذاری شوند، در درازمدت رشد شگفت‌انگیزی خواهند داشت.'),
        _buildTipCard('💳 مدیریت هوشمند کارت‌های بانکی', 'برای هر دسته از هزینه‌های خود (خوراک، تفریح، پس‌انداز) یک کارت جداگانه یا حساب مشخص در نظر بگیرید تا ولخرجی‌ها به حداقل برسند.'),
      ],
    );
  }

  Widget _buildTipCard(String title, String desc) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: Colors.teal.withOpacity(0.2))),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.teal, fontSize: 15)),
            const SizedBox(height: 8),
            Text(desc, style: const TextStyle(height: 1.4)),
          ],
        ),
      ),
    );
  }

  // ۶. تب تنظیمات همراه با مدیریت دسته‌بندی‌ها
  Widget _buildSettingsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('تنظیمات برنامه', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const Divider(height: 24),
        SwitchListTile(
          title: const Text('حالت شب (تاریک)'),
          subtitle: const Text('تغییر تم برنامه برای محافظت از چشم'),
          value: widget.isDarkMode,
          onChanged: widget.onThemeChanged,
          secondary: const Icon(Icons.dark_mode_outlined),
        ),
        const Divider(height: 24),
        ListTile(
          leading: const Icon(Icons.category, color: Colors.teal),
          title: const Text('مدیریت دسته‌بندی‌ها'),
          subtitle: const Text('افزودن یا حذف دسته‌بندی‌های درآمد و هزینه'),
          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
          onTap: _showManageCategoriesDialog,
        ),
        const Divider(height: 24),
        ListTile(
          leading: const Icon(Icons.star_outline, color: Colors.amber),
          title: const Text('وضعیت اشتراک'),
          subtitle: Text(widget.isPremium ? 'نسخه کامل (پریمیوم فعال)' : 'نسخه رایگان'),
          trailing: widget.isPremium
              ? const Chip(label: Text('پریمیوم'), backgroundColor: Colors.teal, labelStyle: TextStyle(color: Colors.white))
              : ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white),
                  onPressed: _simulateBazaarPurchase,
                  child: const Text('ارتقا به کامل'),
                ),
        ),
      ],
    );
  }

  // دیالوگ مدیریت دسته‌بندی‌ها (افزودن و حذف)
  void _showManageCategoriesDialog() {
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDState) => AlertDialog(
          title: const Text('مدیریت دسته‌بندی‌ها'),
          content: SizedBox(
            width: double.maxFinite,
            child: DefaultTabController(
              length: 2,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const TabBar(
                    tabs: [
                      Tab(text: 'هزینه‌ها'),
                      Tab(text: 'درآمدها'),
                    ],
                  ),
                  SizedBox(
                    height: 250,
                    child: TabBarView(
                      children: [
                        // لیست دسته‌بندی هزینه‌ها
                        Column(
                          children: [
                            Align(
                              alignment: Alignment.centerLeft,
                              child: TextButton.icon(
                                onPressed: () => _showAddCategoryDialog(true, () => setDState(() {})),
                                icon: const Icon(Icons.add, size: 16),
                                label: const Text('افزودن هزینه جدید'),
                              ),
                            ),
                            Expanded(
                              child: ListView.builder(
                                itemCount: expenseCategories.length,
                                itemBuilder: (context, index) => ListTile(
                                  title: Text(expenseCategories[index]),
                                  trailing: IconButton(
                                    icon: const Icon(Icons.delete, color: Colors.red, size: 20),
                                    onPressed: () {
                                      setDState(() {
                                        expenseCategories.removeAt(index);
                                      });
                                      _saveAll();
                                    },
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        // لیست دسته‌بندی درآمدها
                        Column(
                          children: [
                            Align(
                              alignment: Alignment.centerLeft,
                              child: TextButton.icon(
                                onPressed: () => _showAddCategoryDialog(false, () => setDState(() {})),
                                icon: const Icon(Icons.add, size: 16),
                                label: const Text('افزودن درآمد جدید'),
                              ),
                            ),
                            Expanded(
                              child: ListView.builder(
                                itemCount: incomeCategories.length,
                                itemBuilder: (context, index) => ListTile(
                                  title: Text(incomeCategories[index]),
                                  trailing: IconButton(
                                    icon: const Icon(Icons.delete, color: Colors.red, size: 20),
                                    onPressed: () {
                                      setDState(() {
                                        incomeCategories.removeAt(index);
                                      });
                                      _saveAll();
                                    },
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('بستن'),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddCategoryDialog(bool isExpense, VoidCallback onRefresh) {
    final catC = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isExpense ? 'افزودن دسته‌بندی هزینه' : 'افزودن دسته‌بندی درآمد'),
        content: TextField(
          controller: catC,
          decoration: const InputDecoration(labelText: 'نام دسته‌بندی'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('انصراف')),
          ElevatedButton(
            onPressed: () {
              if (catC.text.isNotEmpty) {
                setState(() {
                  if (isExpense) {
                    expenseCategories.add(catC.text);
                  } else {
                    incomeCategories.add(catC.text);
                  }
                });
                _saveAll();
                Navigator.pop(context);
                onRefresh();
              }
            },
            child: const Text('افزودن'),
          ),
        ],
      ),
    );
  }

  // انتقال وجه
  void _showTransferDialog() {
    if (_accounts.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('برای انتقال وجه باید حداقل دو حساب داشته باشید!')));
      return;
    }
    String fromAcc = _accounts.first.name;
    String toAcc = _accounts[1].name;
    final amountC = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDState) => AlertDialog(
          title: const Text('انتقال وجه بین حساب‌ها'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('از حساب:', style: TextStyle(fontSize: 12, color: Colors.grey)),
              DropdownButton<String>(
                value: fromAcc,
                isExpanded: true,
                items: _accounts.map((a) => DropdownMenuItem(value: a.name, child: Text(a.name))).toList(),
                onChanged: (val) => setDState(() => fromAcc = val!),
              ),
              const SizedBox(height: 10),
              const Text('به حساب:', style: TextStyle(fontSize: 12, color: Colors.grey)),
              DropdownButton<String>(
                value: toAcc,
                isExpanded: true,
                items: _accounts.map((a) => DropdownMenuItem(value: a.name, child: Text(a.name))).toList(),
                onChanged: (val) => setDState(() => toAcc = val!),
              ),
              const SizedBox(height: 10),
              TextField(controller: amountC, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'مبلغ انتقال (تومان)')),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('انصراف')),
            ElevatedButton(
              onPressed: () {
                if (fromAcc == toAcc) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('حساب مبدأ و مقصد نمی‌تواند یکی باشد!')));
                  return;
                }
                double? amt = double.tryParse(amountC.text);
                if (amt != null && amt > 0) {
                  setState(() {
                    for (var acc in _accounts) {
                      if (acc.name == fromAcc) acc.balance -= amt;
                      if (acc.name == toAcc) acc.balance += amt;
                    }
                  });
                  _saveAll();
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('انتقال وجه با موفقیت انجام شد!')));
                }
              },
              child: const Text('انتقال'),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddAccountDialog() {
    final nameC = TextEditingController();
    final balC = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('افزودن حساب جدید'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameC, decoration: const InputDecoration(labelText: 'نام حساب (مثلاً بانک ملت)')),
            TextField(controller: balC, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'موجودی اولیه')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('انصراف')),
          ElevatedButton(
            onPressed: () {
              if (nameC.text.isNotEmpty) {
                setState(() => _accounts.add(BankAccount(name: nameC.text, balance: double.tryParse(balC.text) ?? 0)));
                _saveAll();
                Navigator.pop(context);
              }
            },
            child: const Text('افزودن'),
          ),
        ],
      ),
    );
  }

  void _showAddTransactionDialog() => _showTransactionDialogForm(null);
  void _showEditTransactionDialog(Transaction tx) => _showTransactionDialogForm(tx);

  void _showTransactionDialogForm(Transaction? existingTx) {
    final titleC = TextEditingController(text: existingTx?.title ?? '');
    final amountC = TextEditingController(text: existingTx?.amount.toString() ?? '');
    bool isIncome = existingTx?.isIncome ?? false;
    String selectedAcc = existingTx?.accountName ?? _accounts.first.name;
    
    List<String> currentCategories = isIncome ? incomeCategories : expenseCategories;
    String selectedCategory = existingTx?.category ?? currentCategories.first;
    if (!currentCategories.contains(selectedCategory)) {
      selectedCategory = currentCategories.first;
    }

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDState) {
          List<String> activeCategories = isIncome ? incomeCategories : expenseCategories;
          if (!activeCategories.contains(selectedCategory)) {
            selectedCategory = activeCategories.isNotEmpty ? activeCategories.first : '';
          }

          return AlertDialog(
            title: Text(existingTx == null ? 'ثبت تراکنش جدید' : 'ویرایش تراکنش'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(controller: titleC, decoration: const InputDecoration(labelText: 'عنوان تراکنش')),
                  TextField(controller: amountC, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'مبلغ (تومان)')),
                  const SizedBox(height: 10),
                  const Align(alignment: Alignment.centerRight, child: Text('حساب مقصد/مبدأ:', style: TextStyle(fontSize: 12, color: Colors.grey))),
                  DropdownButton<String>(
                    value: selectedAcc,
                    isExpanded: true,
                    items: _accounts.map((a) => DropdownMenuItem(value: a.name, child: Text(a.name))).toList(),
                    onChanged: (val) => setDState(() => selectedAcc = val!),
                  ),
                  const SizedBox(height: 10),
                  const Align(alignment: Alignment.centerRight, child: Text('دسته‌بندی:', style: TextStyle(fontSize: 12, color: Colors.grey))),
                  DropdownButton<String>(
                    value: selectedCategory,
                    isExpanded: true,
                    items: activeCategories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                    onChanged: (val) => setDState(() => selectedCategory = val!),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ChoiceChip(
                        label: const Text('هزینه'),
                        selected: !isIncome,
                        onSelected: (s) {
                          setDState(() {
                            isIncome = false;
                            activeCategories = expenseCategories;
                            selectedCategory = activeCategories.first;
                          });
                        },
                      ),
                      const SizedBox(width: 10),
                      ChoiceChip(
                        label: const Text('درآمد'),
                        selected: isIncome,
                        onSelected: (s) {
                          setDState(() {
                            isIncome = true;
                            activeCategories = incomeCategories;
                            selectedCategory = activeCategories.first;
                          });
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('انصراف')),
              ElevatedButton(
                onPressed: () {
                  if (titleC.text.isNotEmpty && double.tryParse(amountC.text) != null) {
                    double amt = double.parse(amountC.text);
                    setState(() {
                      if (existingTx != null) {
                        for (var acc in _accounts) {
                          if (acc.name == existingTx.accountName) {
                            acc.balance -= existingTx.isIncome ? existingTx.amount : -existingTx.amount;
                          }
                        }
                        _transactions.removeWhere((t) => t.id == existingTx.id);
                      }

                      final now = Jalali.now();
                      _transactions.insert(
                        0,
                        Transaction(
                          id: existingTx?.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
                          title: titleC.text,
                          amount: amt,
                          isIncome: isIncome,
                          accountName: selectedAcc,
                          category: selectedCategory,
                          date: existingTx?.date ?? '${now.year}/${now.month}/${now.day}',
                        ),
                      );

                      for (var acc in _accounts) {
                        if (acc.name == selectedAcc) {
                          acc.balance += isIncome ? amt : -amt;
                        }
                      }
                    });
                    _saveAll();
                    Navigator.pop(context);
                  }
                },
                child: Text(existingTx == null ? 'ثبت' : 'ویرایش'),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showAddCheckDialog() {
    final bC = TextEditingController(), nC = TextEditingController(), aC = TextEditingController(), dC = TextEditingController();
    bool isRec = true;
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDState) => AlertDialog(
          title: const Text('ثبت چک'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: bC, decoration: const InputDecoration(labelText: 'نام بانک')),
                TextField(controller: nC, decoration: const InputDecoration(labelText: 'شماره چک')),
                TextField(controller: aC, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'مبلغ')),
                TextField(controller: dC, decoration: const InputDecoration(labelText: 'تاریخ سررسید')),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ChoiceChip(label: const Text('دریافتی'), selected: isRec, onSelected: (s) => setDState(() => isRec = true)),
                    const SizedBox(width: 10),
                    ChoiceChip(label: const Text('صادرشده'), selected: !isRec, onSelected: (s) => setDState(() => isRec = false)),
                  ],
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('انصراف')),
            ElevatedButton(
              onPressed: () {
                if (bC.text.isNotEmpty && double.tryParse(aC.text) != null) {
                  setState(() => _checks.add(CheckItem(bankName: bC.text, checkNumber: nC.text, amount: double.parse(aC.text), dueDate: dC.text, isReceived: isRec)));
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

  void _showAddDebtDialog() {
    final pC = TextEditingController(), aC = TextEditingController(), dC = TextEditingController();
    bool isIO = true;
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDState) => AlertDialog(
          title: const Text('ثبت بدهی / طلب'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: pC, decoration: const InputDecoration(labelText: 'نام شخص')),
                TextField(controller: aC, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'مبلغ')),
                TextField(controller: dC, decoration: const InputDecoration(labelText: 'تاریخ تسویه')),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ChoiceChip(label: const Text('طلبکارم'), selected: isIO, onSelected: (s) => setDState(() => isIO = true)),
                    const SizedBox(width: 10),
                    ChoiceChip(label: const Text('بدهکارم'), selected: !isIO, onSelected: (s) => setDState(() => isIO = false)),
                  ],
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('انصراف')),
            ElevatedButton(
              onPressed: () {
                if (pC.text.isNotEmpty && double.tryParse(aC.text) != null) {
                  setState(() => _debts.add(DebtItem(personName: pC.text, amount: double.parse(aC.text), isIOWebt: isIO, dueDate: dC.text)));
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
}
