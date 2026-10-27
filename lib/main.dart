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
      title: 'مدیریت مالی پیشرفته',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(brightness: Brightness.light, primarySwatch: Colors.teal, useMaterial3: true),
      darkTheme: ThemeData(brightness: Brightness.dark, primarySwatch: Colors.teal, useMaterial3: true),
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

// مدل‌های داده
class BankAccount {
  final String name;
  double balance;
  BankAccount({required this.name, required this.balance});
  Map<String, dynamic> toJson() => {'name': name, 'balance': balance};
  factory BankAccount.fromJson(Map<String, dynamic> json) => BankAccount(name: json['name'], balance: json['balance']);
}

class Transaction {
  final String title;
  final double amount;
  final bool isIncome;
  final String accountName;
  final String date;
  Transaction({required this.title, required this.amount, required this.isIncome, required this.accountName, required this.date});
  Map<String, dynamic> toJson() => {'title': title, 'amount': amount, 'isIncome': isIncome, 'accountName': accountName, 'date': date};
  factory Transaction.fromJson(Map<String, dynamic> json) => Transaction(title: json['title'], amount: json['amount'], isIncome: json['isIncome'], accountName: json['accountName'] ?? 'اصلی', date: json['date']);
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
  List<BankAccount> _accounts = [BankAccount(name: 'حساب پیش‌فرض / کیف پول', balance: 0)];
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
  }

  Future<void> _saveAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('accounts', jsonEncode(_accounts.map((e) => e.toJson()).toList()));
    await prefs.setString('transactions', jsonEncode(_transactions.map((e) => e.toJson()).toList()));
    await prefs.setString('checks', jsonEncode(_checks.map((e) => e.toJson()).toList()));
    await prefs.setString('debts', jsonEncode(_debts.map((e) => e.toJson()).toList()));
  }

  double get _totalBalance => _accounts.fold(0.0, (sum, acc) => sum + acc.balance);
  double get _totalIncome => _transactions.where((t) => t.isIncome).fold(0.0, (s, t) => s + t.amount);
  double get _totalExpense => _transactions.where((t) => !t.isIncome).fold(0.0, (s, t) => s + t.amount);

  void _simulateBazaarPurchase() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('پرداخت درون‌برنامه‌ای بازار'),
        content: const Text('برای فعال‌سازی بخش مدیریت چک و بدهی، مبلغ ۵۰,۰۰۰ تومان از طریق کافه‌بازار پرداخت شود؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('انصراف')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white),
            onPressed: () {
              Navigator.pop(context);
              widget.onUnlockPremium();
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('پرداخت موفق! امکانات ویژه فعال شد.')));
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
      _buildFinancialTab(),
      _buildChartsTab(),
      widget.isPremium ? _buildChecksTab() : _buildLockedView('مدیریت چک‌ها'),
      widget.isPremium ? _buildDebtsTab() : _buildLockedView('مدیریت بدهی‌ها'),
      _buildPlanningAndTipsTab(),
      _buildSettingsTab(),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('مدیریت مالی هوشمند'), centerTitle: true, backgroundColor: Colors.teal, foregroundColor: Colors.white),
      body: pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Colors.teal,
        unselectedItemColor: Colors.grey,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.wallet), label: 'مالی'),
          BottomNavigationBarItem(icon: Icon(Icons.bar_chart), label: 'نمودار'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt), label: 'چک'),
          BottomNavigationBarItem(icon: Icon(Icons.money_off), label: 'بدهی'),
          BottomNavigationBarItem(icon: Icon(Icons.lightbulb), label: 'آموزش'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'تنظیمات'),
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
            const Icon(Icons.lock, size: 70, color: Colors.orange),
            const SizedBox(height: 16),
            Text('$name قفل است', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('این بخش ویژه است. برای دسترسی از طریق کافه‌بازار اقدام کنید.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white),
              onPressed: _simulateBazaarPurchase,
              icon: const Icon(Icons.shopping_bag),
              label: const Text('خرید از کافه‌بازار'),
            ),
          ],
        ),
      ),
    );
  }

  // ۱. تب مالی و حساب‌ها
  Widget _buildFinancialTab() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [Colors.teal.shade700, Colors.teal.shade400]),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              const Text('موجودی کل تمامی حساب‌ها', style: TextStyle(color: Colors.white70)),
              const SizedBox(height: 6),
              Text('${_totalBalance.toStringAsFixed(0)} تومان', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
              const Divider(color: Colors.white30),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Text('درآمد: +${_totalIncome.toStringAsFixed(0)}', style: const TextStyle(color: Colors.greenAccent)),
                  Text('هزینه: -${_totalExpense.toStringAsFixed(0)}', style: const TextStyle(color: Colors.redAccent)),
                ],
              ),
            ],
          ),
        ),
        // لیست حساب‌ها
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('حساب‌های من', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              TextButton.icon(onPressed: _showAddAccountDialog, icon: const Icon(Icons.add, size: 18), label: const Text('افزودن حساب'))
            ],
          ),
        ),
        SizedBox(
          height: 70,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: _accounts.length,
            itemBuilder: (context, i) => Container(
              width: 140,
              margin: EdgeInsets.only(left: i == 0 ? 16 : 8, right: i == _accounts.length - 1 ? 16 : 0),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(border: Border.all(color: Colors.teal), borderRadius: BorderRadius.circular(10)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(_accounts[i].name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12), overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Text('${_accounts[i].balance.toStringAsFixed(0)} ت', style: const TextStyle(fontSize: 13, color: Colors.teal)),
                ],
              ),
            ),
          ),
        ),
        const Divider(height: 20),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Align(alignment: Alignment.centerRight, child: Text('تراکنش‌های اخیر', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
        ),
        Expanded(
          child: _transactions.isEmpty
              ? const Center(child: Text('تراکنشی ثبت نشده است'))
              : ListView.builder(
                  itemCount: _transactions.length,
                  itemBuilder: (context, index) {
                    final tx = _transactions[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      child: ListTile(
                        leading: Icon(tx.isIncome ? Icons.arrow_downward : Icons.arrow_upward, color: tx.isIncome ? Colors.green : Colors.red),
                        title: Text(tx.title),
                        subtitle: Text('حساب: ${tx.accountName} | ${tx.date}'),
                        trailing: Text('${tx.isIncome ? '+' : '-'}${tx.amount.toStringAsFixed(0)}', style: TextStyle(color: tx.isIncome ? Colors.green : Colors.red, fontWeight: FontWeight.bold)),
                      ),
                    );
                  },
                ),
        ),
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(45)),
            onPressed: _showAddTransactionDialog,
            icon: const Icon(Icons.add),
            label: const Text('ثبت تراکنش جدید'),
          ),
        ),
      ],
    );
  }

  // ۲. تب نمودارها و تحلیل گرافیکی
  Widget _buildChartsTab() {
    double maxVal = (_totalIncome > _totalExpense ? _totalIncome : _totalExpense);
    if (maxVal == 0) maxVal = 1;

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('نمودار مقایسه کل دخل و خرج', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                // ستون درآمد
                Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text('+${_totalIncome.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, color: Colors.green)),
                    const SizedBox(height: 6),
                    Container(
                      width: 50,
                      height: (_totalIncome / maxVal) * 200,
                      decoration: BoxDecoration(color: Colors.green, borderRadius: BorderRadius.circular(8)),
                    ),
                    const SizedBox(height: 8),
                    const Text('کل درآمد', style: TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
                // ستون هزینه
                Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text('-${_totalExpense.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, color: Colors.red)),
                    const SizedBox(height: 6),
                    Container(
                      width: 50,
                      height: (_totalExpense / maxVal) * 200,
                      decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(8)),
                    ),
                    const SizedBox(height: 8),
                    const Text('کل هزینه', style: TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('وضعیت تراز مالی:', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(_totalIncome >= _totalExpense ? 'وضعیت عالی: درآمد شما بیشتر از هزینه‌هایتان است.' : 'هشدار: هزینه‌ها از درآمد شما بیشتر شده است!'),
                ],
              ),
            ),
          )
        ],
      ),
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
                        title: Text('بانک: ${c.bankName} (${c.checkNumber})'),
                        subtitle: Text('سررسید: ${c.dueDate} | ${c.isReceived ? "دریافتی" : "صادرشده"}'),
                        trailing: Text('${c.amount.toStringAsFixed(0)} ت', style: const TextStyle(fontWeight: FontWeight.bold)),
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
    return Column(
      children: [
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
                        title: Text(d.personName),
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

  // ۵. تب مطالب مالی و برنامه‌ریزی (سرگرم‌کننده و آموزشی)
  Widget _buildPlanningAndTipsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('برنامه‌ریزی و مطالب مالی سرگرم‌کننده', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Card(
          color: Colors.teal.shade50,
          child: const Padding(
            padding: EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('💡 قانون طلایی بودجه‌بندی (۵۰ / ۳۰ / ۲۰)', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.teal)),
                SizedBox(height: 6),
                Text('۵۰ درصد درآمدتان را برای هزینه‌های ضروری (اجاره، قبض، خوراک)، ۳۰ درصد را برای خواسته‌ها و تفریح، و حتماً ۲۰ درصد را پس‌انداز یا سرمایه‌گذاری کنید.'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 10),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('🚀 ترفند مدیریت جیب', style: TextStyle(fontWeight: FontWeight.bold)),
                SizedBox(height: 6),
                Text('قبل از خرید هر چیز غیرضروری از خود بپرسید: آیا این کالا برای من «نیاز» است یا «هوس لحظه‌ای»؟ صبر کردن برای ۲۴ ساعت معجزه می‌کند!'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 10),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('🎯 هدف‌گذاری مالی ماهانه', style: TextStyle(fontWeight: FontWeight.bold)),
                SizedBox(height: 6),
                Text('همیشه برای پس‌انداز خود یک هدف مشخص تعیین کنید؛ مثلاً خرید وسیله یا سفر. داشتن هدف انگیزه پس‌انداز کردن را چند برابر می‌کند.'),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ۶. تب تنظیمات
  Widget _buildSettingsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('تنظیمات برنامه', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const Divider(),
        SwitchListTile(
          title: const Text('حالت شب (تاریک)'),
          value: widget.isDarkMode,
          onChanged: widget.onThemeChanged,
          secondary: const Icon(Icons.dark_mode),
        ),
        const Divider(),
        ListTile(
          title: const Text('وضعیت اشتراک'),
          subtitle: Text(widget.isPremium ? 'نسخه کامل (فعال)' : 'نسخه رایگان'),
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

  // دیالوگ‌های افزودن
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
            TextField(controller: nameC, decoration: const InputDecoration(labelText: 'نام حساب (مثلاً بانک ملی)')),
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

  void _showAddTransactionDialog() {
    final titleC = TextEditingController();
    final amountC = TextEditingController();
    bool isIncome = false;
    String selectedAcc = _accounts.first.name;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDState) => AlertDialog(
          title: const Text('ثبت تراکنش'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: titleC, decoration: const InputDecoration(labelText: 'عنوان')),
                TextField(controller: amountC, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'مبلغ')),
                DropdownButton<String>(
                  value: selectedAcc,
                  isExpanded: true,
                  items: _accounts.map((a) => DropdownMenuItem(value: a.name, child: Text(a.name))).toList(),
                  onChanged: (val) => setDState(() => selectedAcc = val!),
                ),
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
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('انصراف')),
            ElevatedButton(
              onPressed: () {
                if (titleC.text.isNotEmpty && double.tryParse(amountC.text) != null) {
                  double amt = double.parse(amountC.text);
                  setState(() {
                    _transactions.insert(0, Transaction(title: titleC.text, amount: amt, isIncome: isIncome, accountName: selectedAcc, date: '${Jalali.now().year}/${Jalali.now().month}/${Jalali.now().day}'));
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
              child: const Text('ثبت'),
            ),
          ],
        ),
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
                TextField(controller: dC, decoration: const InputDecoration(labelText: 'سررسید')),
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
          title: const Text('ثبت بدهی/طلب'),
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
