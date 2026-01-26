import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { languages, type LanguageCode } from '@/i18n';
import { useToast } from '@/hooks/use-toast';

interface LanguageSelectorProps {
  variant?: 'icon' | 'full';
  className?: string;
}

export function LanguageSelector({ variant = 'icon', className }: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();
  const { toast } = useToast();

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    toast({
      title: t('settings.languageChanged'),
      description: languages.find(l => l.code === code)?.name,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={variant === 'icon' ? 'icon' : 'default'} className={className}>
          {variant === 'icon' ? (
            <Globe className="h-5 w-5" />
          ) : (
            <span className="flex items-center gap-2">
              <span className="text-lg">{currentLanguage.flag}</span>
              <span>{currentLanguage.name}</span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`flex items-center gap-3 cursor-pointer ${
              i18n.language === language.code ? 'bg-accent' : ''
            }`}
          >
            <span className="text-lg">{language.flag}</span>
            <span>{language.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
