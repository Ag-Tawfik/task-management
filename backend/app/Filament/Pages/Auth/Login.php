<?php

namespace App\Filament\Pages\Auth;

use Filament\Auth\Pages\Login as BaseLogin;
use Filament\Facades\Filament;

class Login extends BaseLogin
{
    public function mount(): void
    {
        if (Filament::auth()->check()) {
            redirect()->intended(Filament::getUrl());
        }

        // Dev convenience: prefill admin credentials for testers.
        if (app()->isLocal()) {
            $this->form->fill([
                'email' => 'admin@example.com',
                'password' => 'password',
            ]);

            return;
        }

        $this->form->fill();
    }
}

