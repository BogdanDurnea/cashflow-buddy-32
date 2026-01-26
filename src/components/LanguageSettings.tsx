import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';
import { languages, type LanguageCode } from '@/i18n';
import { useToast } from '@/hooks/use-toast';

export function LanguageSettings() {
  const { i18n, t } = useTranslation();
  const { toast } = useToast();

  const handleLanguageChange = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    toast({
      title: t('settings.languageChanged'),
      description: languages.find(l => l.code === code)?.name,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t('settings.language')}
        </CardTitle>
        <CardDescription>
          {t('settings.changeLanguage')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={i18n.language}
          onValueChange={(value) => handleLanguageChange(value as LanguageCode)}
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {languages.map((language) => (
            <div key={language.code} className="flex items-center space-x-2">
              <RadioGroupItem value={language.code} id={language.code} />
              <Label
                htmlFor={language.code}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span className="text-xl">{language.flag}</span>
                <span>{language.name}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
