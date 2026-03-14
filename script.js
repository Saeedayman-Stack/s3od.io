/**
 * TruthShield AI - Core Application Logic
 * Powered by OpenRouter.ai
 * Built with Alpine.js & Tailwind CSS
 */

document.addEventListener('alpine:init', () => {
    Alpine.data('truthShield', () => ({
        // App State
        lang: localStorage.getItem('truthshield_lang') || 'ar',
        darkMode: localStorage.getItem('truthshield_dark') === 'true',
        showHistory: false,
        showSettings: false,
        loading: false,
        
        // Input & API
        inputText: '',
        apiKey: localStorage.getItem('truthshield_key') || '',
        selectedModel: 'auto',
        models: [
            { id: 'auto', name: 'تلقائي (الأسرع)' },
            { id: 'anthropic/claude-3.5-sonnet:beta', name: 'Claude 3.5 Sonnet' },
            { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1' },
            { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
            { id: 'meta-llama/llama-3.1-405b-instruct:free', name: 'Llama 3.1 405B (Free)' }
        ],

        // Results
        result: null,
        history: JSON.parse(localStorage.getItem('truthshield_history') || '[]'),

        // i18n Dictionary
        translations: {
            ar: {
                heroTitle: "هل هذا الخبر كذب؟ تحقق في 3 ثوانٍ",
                heroSub: "أقوى مدقق حقائق مدعوم بالذكاء الاصطناعي يحلل أي نص أو رابط تلقائياً لضمان مصداقية ما تقرأ.",
                placeholder: "الصق الخبر هنا أو الرابط المريب للتحقق...",
                analyzeBtn: "ابدأ التحقق مجاناً",
                loadingTitle: "جاري تحليل الحقائق...",
                loadingSub: "نحن نقارن الخبر مع ملايين المصادر الموثوقة الآن.",
                analysisResult: "نتيجة التحليل",
                truthScore: "مؤشر المصداقية",
                reasoningSteps: "خطوات التحقق والمنطق",
                sources: "المصادر والمراجع",
                copyReport: "نسخ التقرير الكامل",
                backToInput: "تحقق من خبر آخر",
                history: "سجل التحققات",
                noHistory: "لا يوجد سجل بعد",
                settings: "الإعدادات",
                apiKeyLabel: "مفتاح API الخاص بـ OpenRouter",
                apiKeyHint: "يمكنك الحصول على مفتاحك مجاناً من ",
                saveBtn: "حفظ الإعدادات",
                privacy: "سياسة الخصوصية",
                terms: "شروط الاستخدام",
                errorKey: "يرجى إدخال مفتاح API في الإعدادات أولاً",
                errorGeneric: "حدث خطأ أثناء التحليل، يرجى المحاولة مرة أخرى",
                verdictTrue: "حقيقي",
                verdictDoubt: "مشكوك فيه",
                verdictFake: "كذب / مضلل",
                verdictUnclear: "غير واضح"
            },
            en: {
                heroTitle: "Is this news fake? Verify in 3 seconds",
                heroSub: "The most powerful AI-powered fact-checker that automatically analyzes any text or link to ensure credibility.",
                placeholder: "Paste the news or suspicious link here...",
                analyzeBtn: "Start Verification Free",
                loadingTitle: "Analyzing Facts...",
                loadingSub: "We are comparing this news with millions of trusted sources.",
                analysisResult: "Analysis Result",
                truthScore: "Credibility Score",
                reasoningSteps: "Reasoning & Verification Steps",
                sources: "Sources & References",
                copyReport: "Copy Full Report",
                backToInput: "Verify another news",
                history: "Verification History",
                noHistory: "No history yet",
                settings: "Settings",
                apiKeyLabel: "OpenRouter API Key",
                apiKeyHint: "Get your free API key from ",
                saveBtn: "Save Settings",
                privacy: "Privacy Policy",
                terms: "Terms of Service",
                errorKey: "Please enter your API key in settings first",
                errorGeneric: "An error occurred during analysis, please try again",
                verdictTrue: "True",
                verdictDoubt: "Suspicious",
                verdictFake: "Fake / Misleading",
                verdictUnclear: "Unclear"
            }
        },

        init() {
            // Update document direction
            this.$watch('lang', val => {
                document.documentElement.dir = val === 'ar' ? 'rtl' : 'ltr';
                document.documentElement.lang = val;
                localStorage.setItem('truthshield_lang', val);
                lucide.createIcons(); // Re-create icons for direction changes
            });

            this.$watch('darkMode', val => {
                localStorage.setItem('truthshield_dark', val);
            });

            // Initial icon creation
            lucide.createIcons();
            document.documentElement.dir = this.lang === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = this.lang;
        },

        t(key) {
            return this.translations[this.lang][key] || key;
        },

        toggleLang() {
            this.lang = this.lang === 'ar' ? 'en' : 'ar';
        },

        autoResize(el) {
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        },

        async analyze() {
            if (!this.apiKey) {
                alert(this.t('errorKey'));
                this.showSettings = true;
                return;
            }

            this.loading = true;
            this.result = null;

            try {
                const prompt = `You are a professional fact-checker from FactCheck.org + Snopes. Analyze the following text/link for truthfulness. 
                TEXT: ${this.inputText}
                
                Respond ONLY in valid JSON format:
                {
                    "truth_score": 0-100,
                    "verdict": "True|Suspicious|Fake|Unclear",
                    "reasoning": ["Step 1 explanation", "Step 2 explanation", ...],
                    "sources": ["Link 1", "Link 2"],
                    "confidence": "high|medium|low"
                }
                If the language of the input is Arabic, provide the "reasoning" and "verdict" in Arabic. Otherwise, use English.`;

                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': window.location.origin,
                        'X-Title': 'TruthShield AI'
                    },
                    body: JSON.stringify({
                        model: this.selectedModel === 'auto' ? 'anthropic/claude-3.5-sonnet:beta' : this.selectedModel,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.1,
                        response_format: { type: "json_object" }
                    })
                });

                if (!response.ok) throw new Error('API request failed');

                const data = await response.json();
                const content = data.choices[0].message.content;
                this.result = JSON.parse(content);
                
                // Add to history
                this.addToHistory({
                    id: Date.now(),
                    text: this.inputText.substring(0, 100) + (this.inputText.length > 100 ? '...' : ''),
                    result: this.result,
                    timestamp: new Date().toISOString()
                });

                // Scroll to results
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    lucide.createIcons();
                }, 100);

            } catch (error) {
                console.error(error);
                alert(this.t('errorGeneric'));
            } finally {
                this.loading = false;
            }
        },

        addToHistory(item) {
            this.history.unshift(item);
            if (this.history.length > 50) this.history.pop();
            localStorage.setItem('truthshield_history', JSON.stringify(this.history));
        },

        deleteHistory(id) {
            this.history = this.history.filter(i => i.id !== id);
            localStorage.setItem('truthshield_history', JSON.stringify(this.history));
        },

        loadFromHistory(item) {
            this.result = item.result;
            this.showHistory = false;
            setTimeout(() => lucide.createIcons(), 100);
        },

        resetView() {
            this.result = null;
            this.inputText = '';
            setTimeout(() => lucide.createIcons(), 100);
        },

        saveSettings() {
            localStorage.setItem('truthshield_key', this.apiKey);
            this.showSettings = false;
        },

        getScoreColorClass(score = this.result?.truth_score) {
            if (score > 80) return 'text-success';
            if (score > 40) return 'text-warning';
            return 'text-danger';
        },

        getScoreBgClass(score = this.result?.truth_score) {
            if (score > 80) return 'bg-success/10 text-success';
            if (score > 40) return 'bg-warning/10 text-warning';
            return 'bg-danger/10 text-danger';
        },

        getVerdictLabel() {
            const v = this.result?.verdict?.toLowerCase();
            if (v?.includes('true') || v?.includes('حقيقي')) return this.t('verdictTrue');
            if (v?.includes('suspicious') || v?.includes('مشكوك')) return this.t('verdictDoubt');
            if (v?.includes('fake') || v?.includes('كذب')) return this.t('verdictFake');
            return this.t('verdictUnclear');
        },

        share(platform) {
            const text = `Verified by TruthShield AI: This news has a ${this.result.truth_score}% credibility score. #TruthShield #FactCheck`;
            const url = window.location.href;
            if (platform === 'twitter') {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
            }
        },

        copyReport() {
            const report = `
TruthShield AI Report
-------------------
Score: ${this.result.truth_score}%
Verdict: ${this.result.verdict}
Reasoning:
${this.result.reasoning.map((r, i) => `${i + 1}. ${r}`).join('\n')}
Sources:
${this.result.sources.join('\n')}
            `;
            navigator.clipboard.writeText(report);
            alert('تم نسخ التقرير بنجاح!');
        },

        exportJSON() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.result, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "truthshield_report.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }
    }));
});
